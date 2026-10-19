// Função autocontida: chrome.scripting.executeScript não transporta closures.
export function inspecionarTelaCenti() {
  if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) {
    throw Error('Abra a Centi de Caetité antes de executar o diagnóstico.');
  }
  const visivel = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  if ([...document.querySelectorAll('input[type=password]')].some(visivel)) {
    throw Error('Entre na Centi e abra a tela de serviços antes do diagnóstico.');
  }
  const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim().toUpperCase();
  // Só devolver rótulos de uma lista fixa, nunca texto arbitrário da página.
  const rotulos = new Map([
    ['ID', 'ID'], ['CODIGO', 'Código'], ['CODIGO COMPLETO', 'Código completo'],
    ['SERVICO', 'Serviço'], ['SERVICOS', 'Serviços'], ['NOME', 'Nome'],
    ['DESCRICAO', 'Descrição'], ['ALIQUOTA', 'Alíquota'], ['ALIQUOTA (%)', 'Alíquota (%)'],
    ['SITUACAO', 'Situação'], ['DATA INICIO', 'Data início'], ['DATA DE INICIO', 'Data de início'],
    ['DATA FIM', 'Data fim'], ['DATA DE FIM', 'Data de fim'], ['ACOES', 'Ações'],
    ['NOVO', 'Novo'], ['INCLUIR', 'Incluir'], ['ADICIONAR', 'Adicionar'],
    ['SALVAR', 'Salvar'], ['PESQUISAR', 'Pesquisar'], ['CANCELAR', 'Cancelar'],
    ['PROXIMO', 'Próximo'], ['PROXIMA', 'Próxima'], ['ANTERIOR', 'Anterior'],
    ['PRIMEIRO', 'Primeiro'], ['ULTIMO', 'Último'], ['FECHAR', 'Fechar']
  ]);
  const rotulo = e => rotulos.get(normal(e.textContent)) || 'não reconhecido';
  const familias = ['IdServico', 'Aliquota', 'DataInicio', 'DataFim', 'EspecificarCnae', 'Id'];
  const campos = [...document.querySelectorAll('input[id], select[id]')].filter(visivel)
    .flatMap(e => {
      const familia = familias.find(f => e.id.startsWith(f));
      if (!familia) return [];
      return [{familia, secundario: e.id.endsWith('-second'), tag: e.tagName.toLowerCase(),
        tipo: e.tagName === 'INPUT' ? e.type : 'select', somenteLeitura: Boolean(e.readOnly),
        desabilitado: Boolean(e.disabled)}];
    });
  const grades = [...document.querySelectorAll('.wj-flexgrid, table, [role=grid]')]
    .filter(e => visivel(e) && !e.parentElement?.closest('.wj-flexgrid, table, [role=grid]'))
    .map((grade, indice) => {
      const linhas = [...grade.querySelectorAll('[role=row], tr, .wj-cells > .wj-row')].filter(visivel);
      const seletorCelulas = '[role=gridcell], td, .wj-cell';
      const linhasDados = linhas.filter(l => !l.closest('.wj-colheaders, .wj-rowheaders, thead')
        && l.querySelector(seletorCelulas));
      return {
        indice,
        tipo: grade.matches('.tableFilterSearch--modal') ? 'lupa' : 'lista',
        tecnologia: grade.matches('.wj-flexgrid') ? 'wijmo' : grade.tagName === 'TABLE' ? 'table' : 'aria-grid',
        cabecalhos: [...grade.querySelectorAll('[role=columnheader], th, .wj-colheaders .wj-cell')].filter(visivel).map(rotulo),
        linhasVisiveis: linhasDados.length,
        celulasPorLinha: [...new Set(linhasDados.map(l => l.querySelectorAll(seletorCelulas).length))],
        estruturaWijmo: {
          paineisDados: grade.querySelectorAll('.wj-cells').length,
          paineisCabecalho: grade.querySelectorAll('.wj-colheaders').length,
          linhasNoDom: grade.querySelectorAll('.wj-cells > .wj-row').length,
          celulasNoDom: grade.querySelectorAll('.wj-cells .wj-cell').length
        },
        possuiRolagem: grade.scrollHeight > grade.clientHeight
          || [...grade.querySelectorAll('.wj-cells, .wj-content, [wj-part=root]')]
            .some(e => e.scrollHeight > e.clientHeight)
      };
    });
  const botoes = [...document.querySelectorAll('button, [role=button], input[type=button], input[type=submit]')]
    .filter(visivel).map(e => ({rotulo: rotulo(e), desabilitado: Boolean(e.disabled)}));
  return {
    tipo: 'diagnostico_estrutura_centi', versao: 2, geradoEm: new Date().toISOString(),
    destino: 'Centi de Caetité', somenteLeitura: true, salvo: false,
    campos, grades, botoes,
    lupasVisiveis: [...document.querySelectorAll('.iconSearchReference')].filter(visivel).length,
    filtrosVisiveis: [...document.querySelectorAll('.rowFilter')].filter(visivel).length,
    iframesVisiveis: [...document.querySelectorAll('iframe')].filter(visivel).length,
    observacao: 'Estrutura visível do documento principal. Não lê células, valores, URLs, cookies ou armazenamento. Não comprova leitura completa de listas paginadas ou virtualizadas.'
  };
}
