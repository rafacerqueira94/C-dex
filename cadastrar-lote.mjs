import {compararCaptura} from './comparar-captura.mjs';

export async function cadastrarLote({plano,catalogo,cnpj,ausenciaConferida,retomarPendentes=false},io) {
  const r={tipo:'cadastro_servicos_centi',modo:'salvamento_final',ok:false,concluido:false,etapas:[],resultadoIncerto:false};
  let acionando=false;
  const executar=async(etapa,acao)=>{
    r.etapa=etapa;io.progresso?.(etapa);
    const resultado=await acao();r.etapas.push({etapa,codigo:r.codigoAtual,resultado});
    if(etapa==='salvar')acionando=false;
    if(!resultado?.ok){r.resultadoIncerto ||= Boolean(resultado?.salvamentoAcionado || resultado?.salvo===null);throw Error(resultado?.mensagem || `Etapa ${etapa} não confirmada.`);}
    return resultado;
  };
  const ler=async()=>{const c=await io.ler();if(c?.tipo!=='captura_vinculos_centi'||c.linhasNaoInterpretadas)throw Error(c?.mensagem || 'A lista não pôde ser interpretada.');return c;};
  const normal=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
  const preservado=(antigos,atuais)=>antigos.length===atuais.length && antigos.every(v=>atuais.some(n=>n.idVinculo===v.idVinculo&&n.nome===v.nome&&n.dataInicio===v.dataInicio&&(n.dataFim===v.dataFim||n.dataFim===null||v.dataFim===null)));
  const preenchidos=[];
  try {
    if(ausenciaConferida!==true)throw Error('Confira a empresa e as alterações pendentes antes de iniciar.');
    let captura=await ler();
    let comparacao=compararCaptura(plano,captura,catalogo,cnpj);
    r.ultimaCaptura=captura;r.comparacao=comparacao;
    if(comparacao.servicos.some(s=>s.situacao==='conflito') || (comparacao.totalVinculosPendentes && !retomarPendentes))throw Error('Há conflitos ou alterações pendentes antes do lote.');
    if(retomarPendentes){
      const hoje=io.dataInicio?.()??new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());
      for(const v of captura.vinculosPendentes||[]){
        const candidatos=comparacao.servicos.filter(s=>s.situacao==='preenchido_sem_salvar').filter(s=>{
          const registro=catalogo.find(a=>String(a.Id)===String(s.id));return [String(s.id),normal(registro?.Nome)].includes(normal(v.nome));
        });
        if(candidatos.length!==1 || v.dataInicio!==hoje || !(v.dataFim==='' || (captura.dataFimDisponivel===false&&v.dataFim===null)))throw Error('As pendências não correspondem exclusivamente aos serviços e datas deste cartão.');
        const s=candidatos[0],registro=catalogo.find(a=>String(a.Id)===String(s.id));
        preenchidos.push({servico:{...s,nome:registro.Nome},campos:{idVinculo:'0',dataInicio:hoje,dataFim:''},origem:'pendencia_revisada_pelo_operador'});
      }
      if(!preenchidos.length)throw Error('Nenhum serviço pendente do cartão foi encontrado para retomar.');
      r.pendenciasRetomadas=preenchidos.map(p=>p.servico.codigo);
    }
    const iniciais=JSON.stringify(captura.registros);
    const faltantes=comparacao.servicos.filter(s=>s.situacao==='nao_localizado_na_captura');
    let anterior=null;
    for(const s of faltantes){
      const registro=catalogo.find(a=>String(a.Id)===String(s.id)&&a.CodigoCompleto===s.codigo&&a.Situacao==='Ativo'&&a.Aliquota===s.aliquota);
      if(!registro)throw Error('Registro municipal não confirmado.');
      const servico={...s,nome:registro.Nome};r.codigoAtual=s.codigo;
      // Antes de cada Novo, a lista anterior foi conferida, sem salvar.
      await executar('abrir_vinculo',()=>io.navegar('novo',{quantidadePendente:preenchidos.length}));
      const selecao=await executar('pesquisar_selecionar',()=>io.selecionar({servico,cnpjEsperado:cnpj,cnpjConfirmado:cnpj,conferido:true,ausenciaConferida:true,selecionar:true}));
      const campos=selecao.campos;
      const hoje=io.dataInicio?.()??new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());
      if(!selecao.selecionado||!selecao.datasPreservadas||campos?.idVinculo!=='0'||campos.dataInicio!==hoje||campos.dataFim!=='')throw Error('Seleção ou datas não conferidas.');
      await executar('conferir_pendencia',()=>io.conferir({servico,campos,cnpjEsperado:cnpj,cnpjConfirmado:cnpj,revisado:true,somenteEstaPendencia:true,conferirApenas:true}));
      preenchidos.push({servico,campos});anterior={quantidade:preenchidos.length,servico,campos};
      await executar('voltar_servicos_pendentes',()=>io.navegar('lista',{lote:anterior}));
      captura=await ler();r.ultimaCaptura=captura;
      if(!preservado(JSON.parse(iniciais),captura.registros))throw Error('Os vínculos existentes mudaram durante o lote.');
      const pendentes=captura.vinculosPendentes||[];
      if(pendentes.length!==preenchidos.length || preenchidos.some(p=>pendentes.filter(v=>
        [String(p.servico.id),p.servico.codigo,normal(p.servico.nome)].includes(normal(v.nome))&&v.dataInicio===p.campos.dataInicio&&(v.dataFim===p.campos.dataFim||(captura.dataFimDisponivel===false&&v.dataFim===null))).length!==1))throw Error('A lista de pendências não corresponde exclusivamente aos serviços deste lote.');
      comparacao=compararCaptura(plano,captura,catalogo,cnpj);r.comparacao=comparacao;
    }
    if(preenchidos.length){
      acionando=true;
      await executar('salvar',()=>io.salvarLote({revisado:true,cnpjEsperado:cnpj,cnpjConfirmado:cnpj,capturaEsperada:captura,tentativa:io.identificador()}));
      // Um único clique; aguardar a releitura, nunca repetir Salvar em timeout.
      r.resultadoIncerto=true;
      const limite=Date.now()+12000;
      do {
        captura=await ler();r.ultimaCaptura=captura;
        comparacao=compararCaptura(plano,captura,catalogo,cnpj);r.comparacao=comparacao;
        if(!comparacao.totalVinculosPendentes&&comparacao.servicos.every(s=>s.situacao==='localizado'))break;
        if(Date.now()>=limite)throw Error('Os serviços do lote não foram confirmados após Salvar. Não repita a inclusão.');
        await new Promise(resolve=>setTimeout(resolve,100));
      }while(true);
      if(!preservado(JSON.parse(iniciais),captura.registros.filter(n=>JSON.parse(iniciais).some(v=>v.idVinculo===n.idVinculo))))throw Error('Um vínculo anterior não foi confirmado após Salvar.');
      for(const p of preenchidos){
        const vinculo=comparacao.servicos.find(s=>s.codigo===p.servico.codigo);
        const registro=captura.registros.find(v=>vinculo.idsVinculos.map(String).includes(String(v.idVinculo)));
        if(!registro || registro.dataInicio!==p.campos.dataInicio || !(registro.dataFim===p.campos.dataFim || (captura.dataFimDisponivel===false&&registro.dataFim===null)))throw Error('As datas do vínculo salvo não foram confirmadas. Confira a Centi antes de repetir.');
      }
      r.resultadoIncerto=false;
    }
    r.ok=true;r.concluido=true;r.etapa='lista_conferida';r.mensagem='Serviços conferidos na lista. O lote foi salvo com um único clique ao final.';
    if(!preenchidos.length)r.mensagem='Todos os serviços já estavam cadastrados. Nenhum salvamento foi necessário.';
  }catch(e){r.resultadoIncerto ||= acionando;r.mensagem=`${e.message} Fluxo interrompido; confira os serviços pendentes e salvos antes de reiniciar.`;}
  return r;
}
