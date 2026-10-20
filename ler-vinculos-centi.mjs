// Autocontida para execução isolada por chrome.scripting. Somente leitura.
export function lerVinculosCenti() {
  try {
    const falhar = mensagem => { throw Error(mensagem); };
    if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) {
      falhar('Abra a Centi de Caetité.');
    }
    const visivel = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  const tituloColuna = c => {
    const titulo = normal(c.header);
    if (['ID','SERVICO','DATA INICIO','DATA FIM'].includes(titulo)) return titulo;
    const internos = {DATAINICIO:'DATA INICIO', DATAFIM:'DATA FIM'};
    return internos[normal(c.binding)] || titulo;
  };
    if ([...document.querySelectorAll('input[type=password]')].some(visivel)) falhar('Entre na Centi antes de comparar.');
    if ([...document.querySelectorAll('input[id^="IdServico"], .tableFilterSearch--modal')].some(visivel)) {
      falhar('Selecione a pasta Serviços, fora do formulário e com a lupa fechada.');
    }
    const listaVaziaConfirmada = (g,controle) => {
      const view = controle?.collectionView, fonte = view?.sourceCollection;
      const arvore = [...document.querySelectorAll('.divTreeSelected')].filter(visivel).filter(e => normal(e.textContent) === 'SERVICOS');
      const valida = g.matches('.gridCollectionTotal.tableSearch.wj-state-empty') && arvore.length === 1
        && typeof controle?.getCellData === 'function' && controle.columns?.length === 0 && controle.rows?.length === 0
        && Array.isArray(view?.items) && view.items.length === 0 && Array.isArray(fonte) && fonte.length === 0
        && view.isLoading !== true && controle.isUpdating !== true && !(view.pageCount > 1)
        && (view.totalItemCount == null || Number(view.totalItemCount) === 0)
        && !g.closest('[aria-busy=true]') && !g.querySelector('[aria-busy=true]');
      const cache = globalThis.__ponteCentiVazioConfirmado ??= new Map();
      if (!valida) {cache.delete(g);return false;}
      const anterior = cache.get(g);
      if (!anterior || anterior.view !== view || anterior.fonte !== fonte) {cache.set(g,{view,fonte,desde:Date.now()});return false;}
      return Date.now() - anterior.desde >= 700;
    };
    const obrigatorios = ['ID', 'SERVICO', 'DATA INICIO', 'DATA FIM'];
    const grades = [...document.querySelectorAll('.wj-flexgrid')].filter(visivel).map(g => {
      let controle;
      try { controle = globalThis.wijmo?.Control?.getControl?.(g); } catch { /* usar DOM se completo */ }
      const colunas = Array.from(controle?.columns || []);
      const indices = obrigatorios.map(t => colunas.map((c,i) => tituloColuna(c) === t ? i : -1).filter(i => i >= 0));
      if (typeof controle?.getCellData === 'function' && indices.every(i => i.length === 1)) {
        globalThis.__ponteCentiVazioConfirmado?.delete(g);
        return {grade:g, controle, indices:indices.map(i=>i[0])};
      }
      if (listaVaziaConfirmada(g,controle)) return {grade:g,controle,vazia:true};
      const textos = [...g.querySelectorAll('.wj-colheaders .wj-cell')].filter(visivel).map(e=>normal(e.textContent));
      return obrigatorios.every(t=>textos.includes(t)) ? {grade:g,controle:null} : null;
    }).filter(Boolean);
    if (grades.length !== 1) falhar('Não encontrei uma única relação de Serviços com ID e datas no DOM ou na API pública.');
    const {grade, controle, indices} = grades[0];
    if (grades[0].vazia) return {tipo:'captura_vinculos_centi',versao:1,lidoEm:new Date().toISOString(),origemLeitura:'api_publica_lista_vazia',
      registros:[],vinculosPendentes:[],linhasNaoInterpretadas:0,detalhesLinhasNaoInterpretadas:[],repeticoesDeRenderizacao:0,cabecalhosRepetidosIgnorados:0,
      leituraCompleta:false,empresaVerificadaAutomaticamente:false,
      observacao:'Coleção atual de Serviços vazia confirmada na API. Não comprova ausência em outras páginas, filtros ou serviços herdados.'};
    const cabecalhos = controle ? ['', ...obrigatorios] : [...grade.querySelectorAll('.wj-colheaders .wj-cell')].filter(visivel).map(e => normal(e.textContent));
    const modelo = cabecalhos.slice(0, 5);
    if (modelo.length !== 5 || modelo.slice(1).join('|') !== 'ID|SERVICO|DATA INICIO|DATA FIM'
        || cabecalhos.length % 5 !== 0
        || cabecalhos.some((h, i) => h !== modelo[i % 5])) falhar('A ordem das colunas mudou; a leitura foi interrompida.');
    if (controle && (!Number.isSafeInteger(controle.rows?.length) || controle.rows.length > 10000)) falhar('A quantidade de linhas da API não pôde ser conferida.');
    const linhas = controle ? Array.from(controle.rows, (_, i) => ['', ...indices.map(c => String(controle.getCellData(i,c,true) ?? '').replace(/\s+/g,' ').trim())])
      : [...grade.querySelectorAll('.wj-cells > .wj-row')].filter(visivel);
    const registros = new Map();
    const vinculosPendentes = [];
    const detalhesLinhasNaoInterpretadas = [];
    let repeticoesDeRenderizacao = 0, linhasNaoInterpretadas = 0, cabecalhosRepetidosIgnorados = 0;
    for (const linha of linhas) {
      const celulas = Array.isArray(linha) ? null : [...linha.children].filter(e => e.matches('.wj-cell'));
      if (celulas && celulas.length !== 5) {
        linhasNaoInterpretadas++;
        detalhesLinhasNaoInterpretadas.push({motivo: 'quantidade_de_celulas', quantidadeCelulas: celulas.length});
        continue;
      }
      const valores = Array.isArray(linha) ? linha : celulas.map(e => (e.textContent ?? '').replace(/\s+/g, ' ').trim());
      if (valores.every((v, i) => normal(v) === modelo[i])) {
        cabecalhosRepetidosIgnorados++;
        continue;
      }
      const [, idVinculo, nome, dataInicio, dataFim] = valores;
      if (idVinculo === '0' && nome) {
        // Não juntar ID 0: podem existir dois novos vínculos iguais pendentes.
        vinculosPendentes.push({idVinculo, nome, dataInicio, dataFim});
        continue;
      }
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
      tipo: 'captura_vinculos_centi', versao: 1, origemLeitura: controle ? 'api_publica_wijmo' : 'dom', lidoEm: new Date().toISOString(),
      registros: [...registros.values()], vinculosPendentes, linhasNaoInterpretadas, detalhesLinhasNaoInterpretadas, repeticoesDeRenderizacao, cabecalhosRepetidosIgnorados,
      leituraCompleta: false, empresaVerificadaAutomaticamente: false,
      observacao: (controle ? 'Linhas disponíveis na API pública da grade. ' : 'Somente linhas renderizadas. ') + 'Paginação, filtros, serviços herdados e empresa não foram verificados automaticamente.'
    };
  } catch (erro) {
    return {tipo: 'erro_leitura_centi', versao: 1,
      mensagem: erro instanceof Error ? erro.message : 'Não foi possível ler a relação de Serviços.'};
  }
}
