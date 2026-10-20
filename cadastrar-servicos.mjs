import {cadastrarLote} from './cadastrar-lote.mjs';
import {compararCaptura} from './comparar-captura.mjs';

// Uma fila por aba da interface. Cada persistência exige releitura antes de avançar.
export async function cadastrarServicos({plano, catalogo, cnpj, ausenciaConferida, retomarPendentes = false}, io) {
  if (io.lote === true) return cadastrarLote({plano,catalogo,cnpj,ausenciaConferida,retomarPendentes},io);
  const relatorio = {tipo: 'cadastro_servicos_centi', ok: false, concluido: false, etapas: [], etapa: 'comparar', resultadoIncerto: false};
  let acionandoSalvamento = false;
  const executar = async (nome, funcao) => {
    relatorio.etapa = nome;
    io.progresso?.(nome);
    const retorno = await funcao();
    relatorio.etapas.push({etapa: nome, codigo: relatorio.codigoAtual, resultado: retorno});
    if (nome === 'salvar') acionandoSalvamento = false;
    if (!retorno?.ok) {
      if (retorno?.salvo === null || retorno?.salvamentoAcionado) relatorio.resultadoIncerto = true;
      throw Error(retorno?.mensagem || `A etapa ${nome} não foi confirmada.`);
    }
    return retorno;
  };
  const ler = async () => {
    relatorio.etapa = 'reler_servicos';
    const captura = await io.ler();
    if (captura?.tipo === 'erro_leitura_centi') throw Error(captura.mensagem);
    const comparacao = compararCaptura(plano, captura, catalogo, cnpj);
    relatorio.ultimaCaptura = captura;
    relatorio.comparacao = comparacao;
    if (captura.linhasNaoInterpretadas || comparacao.totalVinculosPendentes || comparacao.servicos.some(s => ['conflito', 'preenchido_sem_salvar'].includes(s.situacao))) {
      throw Error('Há linhas não interpretadas, conflitos ou vínculos pendentes. Revise a Centi antes de cadastrar.');
    }
    return comparacao;
  };
  try {
    if (ausenciaConferida !== true) throw Error('Confira a empresa, a ausência de outras alterações e os serviços fora da captura antes de iniciar.');
    let comparacao = await ler();
    for (const s of comparacao.servicos) {
      comparacao = await ler();
      if (comparacao.servicos.find(a => a.codigo === s.codigo)?.situacao === 'localizado') continue;
      const registro = catalogo.find(r => String(r.Id) === String(s.id) && r.CodigoCompleto === s.codigo && r.Situacao === 'Ativo' && r.Aliquota === s.aliquota);
      const servico = {...s, nome: registro.Nome};
      relatorio.codigoAtual = servico.codigo;
      await executar('abrir_vinculo', () => io.navegar('novo'));
      const selecao = await executar('pesquisar_selecionar', () => io.selecionar({servico, cnpjEsperado: cnpj, cnpjConfirmado: cnpj,
        conferido: true, ausenciaConferida: true, selecionar: true}));
      if (!selecao.selecionado || !selecao.campos || selecao.campos.idVinculo !== '0' || selecao.datasPreservadas !== true) throw Error('O formulário não foi conferido após a seleção.');
      const inicioEsperado = io.dataInicio?.() ?? new Intl.DateTimeFormat('pt-BR', {timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric'}).format(new Date());
      if (selecao.campos.dataInicio !== inicioEsperado || selecao.campos.dataFim !== '') throw Error('As datas do vínculo não correspondem ao início de hoje e fim vazio. Confira o formulário antes de salvar.');
      acionandoSalvamento = true;
      const salvo = await executar('salvar', () => io.salvar({servico, campos: selecao.campos, cnpjEsperado: cnpj, cnpjConfirmado: cnpj,
        revisado: true, somenteEstaPendencia: true, tentativa: io.identificador()}));
      acionandoSalvamento = false;
      if (salvo.salvo !== true || !/^[1-9]\d*$/.test(String(salvo.idVinculo))) throw Error('O ID definitivo não foi confirmado.');
      await executar('voltar_servicos', () => io.navegar('lista', {idVinculoEsperado:String(salvo.idVinculo)}));
      comparacao = await ler();
      const conferido = comparacao.servicos.find(a => a.codigo === servico.codigo);
      if (conferido?.situacao !== 'localizado' || !conferido.idsVinculos.map(String).includes(String(salvo.idVinculo))) {
        throw Error('O vínculo salvo não foi confirmado na releitura. Não cadastrar novamente; confira a Centi.');
      }
    }
    relatorio.ok = true; relatorio.concluido = true; relatorio.etapa = 'lista_conferida';
    relatorio.mensagem = 'Todos os serviços selecionados do cartão foram localizados na releitura. Cadastro concluído para esta lista; confira os avisos de cobertura da base.';
  } catch (e) {
    relatorio.resultadoIncerto ||= acionandoSalvamento;
    relatorio.mensagem = `${e.message} Fluxo interrompido. Confira a Centi antes de reiniciar; não repita vínculos já salvos.`;
  }
  return relatorio;
}
