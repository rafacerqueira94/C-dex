// Autocontida para execução isolada por chrome.scripting. Somente leitura.
export function lerVinculosCenti() {
  const falhar = mensagem => { throw Error(mensagem); };
  if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) {
    falhar('Abra a Centi de Caetité.');
  }
  const visivel = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  if ([...document.querySelectorAll('input[type=password]')].some(visivel)) falhar('Entre na Centi antes de comparar.');
  if ([...document.querySelectorAll('input[id^="IdServico"], .tableFilterSearch--modal')].some(visivel)) {
    falhar('Selecione a pasta Serviços, fora do formulário e com a lupa fechada.');
  }
  const grades = [...document.querySelectorAll('.wj-flexgrid')].filter(visivel).filter(g => {
    const textos = [...g.querySelectorAll('.wj-colheaders .wj-cell')].filter(visivel).map(e => normal(e.textContent));
    return ['ID', 'SERVICO', 'DATA INICIO', 'DATA FIM'].every(t => textos.includes(t));
  });
  if (grades.length !== 1) falhar('Não encontrei uma única relação de Serviços com ID e datas.');
  const grade = grades[0];
  const cabecalhos = [...grade.querySelectorAll('.wj-colheaders .wj-cell')].filter(visivel).map(e => normal(e.textContent));
  // A tela observada contém seleção + ID + Serviço + duas datas. O Wijmo pode
  // repetir os cabeçalhos e renderizar uma cópia da mesma linha para medição.
  const modelo = cabecalhos.slice(0, 5);
  if (modelo.length !== 5 || modelo.slice(1).join('|') !== 'ID|SERVICO|DATA INICIO|DATA FIM'
      || cabecalhos.length % 5 !== 0
      || cabecalhos.some((h, i) => h !== modelo[i % 5])) falhar('A ordem das colunas mudou; a leitura foi interrompida.');
  const linhas = [...grade.querySelectorAll('.wj-cells > .wj-row')].filter(visivel);
  const registros = new Map();
  const detalhesLinhasNaoInterpretadas = [];
  let repeticoesDeRenderizacao = 0, linhasNaoInterpretadas = 0;
  for (const linha of linhas) {
    const celulas = [...linha.children].filter(e => e.matches('.wj-cell'));
    if (celulas.length !== 5) {
      linhasNaoInterpretadas++;
      detalhesLinhasNaoInterpretadas.push({motivo: 'quantidade_de_celulas', quantidadeCelulas: celulas.length});
      continue;
    }
    const valores = celulas.map(e => (e.textContent ?? '').replace(/\s+/g, ' ').trim());
    const [, idVinculo, nome, dataInicio, dataFim] = valores;
    // Linhas vazias de inserção/medição não demonstram ausência de registros.
    if (!/^[1-9]\d*$/.test(idVinculo) || !nome) {
      linhasNaoInterpretadas++;
      detalhesLinhasNaoInterpretadas.push({motivo: 'identificacao_invalida', idVazio: !idVinculo, nomeVazio: !nome,
        aparentaCabecalho: normal(idVinculo) === 'ID' && normal(nome) === 'SERVICO'});
      continue;
    }
    const registro = {idVinculo, nome, dataInicio, dataFim};
    const anterior = registros.get(idVinculo);
    if (anterior) {
      if (JSON.stringify(anterior) !== JSON.stringify(registro)) falhar('O mesmo ID de vínculo apareceu com dados divergentes.');
      repeticoesDeRenderizacao++;
    } else registros.set(idVinculo, registro);
  }
  return {
    tipo: 'captura_vinculos_centi', versao: 1, lidoEm: new Date().toISOString(),
    registros: [...registros.values()], linhasNaoInterpretadas, detalhesLinhasNaoInterpretadas, repeticoesDeRenderizacao,
    leituraCompleta: false, empresaVerificadaAutomaticamente: false,
    observacao: 'Somente linhas renderizadas. Paginação, filtros, serviços herdados e empresa não foram verificados automaticamente.'
  };
}
