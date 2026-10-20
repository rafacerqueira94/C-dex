// Executada na aba Centi, após conferir cada formulário e a lista do lote.
export async function salvarLoteCenti(pedido) {
  let salvamentoAcionado=false;
  const normal=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();
  const tituloColuna = c => {
    const titulo = normal(c.header);
    if (['ID','SERVICO','DATA INICIO','DATA FIM'].includes(titulo)) return titulo;
    const internos = {DATAINICIO:'DATA INICIO', DATAFIM:'DATA FIM'};
    return internos[normal(c.binding)] || titulo;
  };
  const esquemaSemFim = colunas => colunas.length === 5
    && !normal(colunas[0].header)
    && tituloColuna(colunas[1]) === 'ID' && normal(colunas[1].binding) === 'ID'
    && tituloColuna(colunas[2]) === 'SERVICO' && tituloColuna(colunas[3]) === 'DATA INICIO'
    && normal(colunas[4].binding) === 'GUID' && colunas[4].visible === false;
  const visivel=e=>e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
  try {
    if(location.origin!=='https://ba.centi.com.br'||!location.pathname.startsWith('/caetite/'))throw Error('Abra a Centi de Caetité.');
    if(pedido?.revisado!==true||!/^\d{14}$/.test(pedido.cnpjEsperado)||pedido.cnpjEsperado!==pedido.cnpjConfirmado)throw Error('Empresa não conferida.');
    const esperado=pedido.capturaEsperada;
    if(!esperado?.vinculosPendentes?.length||esperado.linhasNaoInterpretadas)throw Error('Lote pendente não conferido.');
    if([...document.querySelectorAll('input[type=password],input[id^=IdServico],.tableFilterSearch--modal,[role=dialog],.modal-backdrop')].some(visivel))throw Error('Mantenha apenas a lista de Serviços aberta.');
    const grades=[...document.querySelectorAll('.wj-flexgrid')].filter(visivel).map(g=>globalThis.wijmo?.Control?.getControl?.(g)).filter(c=>{
      const h=Array.from(c?.columns||[]).map(v=>tituloColuna(v));return (['ID','SERVICO','DATA INICIO','DATA FIM'].every(t=>h.filter(v=>v===t).length===1)||esquemaSemFim(Array.from(c.columns||[])))&&typeof c.getCellData==='function';
    });
    if(grades.length!==1)throw Error('A lista do lote não foi identificada na API pública.');
    const grade=grades[0],colunas=Array.from(grade.columns).map(c=>tituloColuna(c));
    const conferir=()=>{
      const registros=[],pendentes=[];
      for(let i=0;i<grade.rows.length;i++){
        const [idVinculo,nome,dataInicio,dataFim]=['ID','SERVICO','DATA INICIO','DATA FIM'].map(t=>colunas.indexOf(t)<0 ? null : String(grade.getCellData(i,colunas.indexOf(t),true)??'').replace(/\s+/g,' ').trim());
        if(!nome||!/^\d+$/.test(idVinculo))throw Error('Linha do lote não interpretada.');
        (idVinculo==='0'?pendentes:registros).push({idVinculo,nome,dataInicio,dataFim});
      }
      const chave=lista=>JSON.stringify(lista.map(v=>JSON.stringify(v)).sort());
      if(chave(registros)!==chave(esperado.registros)||chave(pendentes)!==chave(esperado.vinculosPendentes))throw Error('A lista mudou após a conferência do lote.');
    };
    conferir();
    const botoes=[...document.querySelectorAll('button')].filter(visivel).filter(b=>normal(b.textContent).replace(/\s/g,'')===`SALVAR(${esperado.vinculosPendentes.length})`);
    if(botoes.length!==1)throw Error('O botão Salvar não corresponde à quantidade do lote.');
    const botao=botoes[0];
    if(!botao.id.startsWith('btnFooterSalvar')||botao.matches(':disabled')||botao.closest('[inert],[aria-disabled=true]'))throw Error('O botão Salvar do lote não está disponível.');
    if(typeof pedido.tentativa!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(pedido.tentativa))throw Error('Identificador de tentativa inválido.');
    const tentativas=globalThis.__ponteCentiSalvamentos??=new Set();
    if(tentativas.has(pedido.tentativa))throw Error('Tentativa já acionada. Releia a lista.');
    conferir();tentativas.add(pedido.tentativa);salvamentoAcionado=true;HTMLButtonElement.prototype.click.call(botao);
    return {ok:true,salvo:true,salvamentoAcionado:true,requerReleitura:true,etapa:'lote_enviado',quantidade:esperado.vinculosPendentes.length,
      mensagem:'Salvar acionado uma vez para o lote. A persistência depende da releitura dos IDs definitivos.'};
  }catch(e){return {ok:false,salvo:salvamentoAcionado?null:false,salvamentoAcionado,mensagem:e.message};}
}
