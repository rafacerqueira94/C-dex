// Fluxo de pesquisa reconstruído do trecho 0.5.0 fornecido pelo usuário.
// Abre a lupa e ajusta filtros. Seleção opcional por duplo clique, sem salvar.
export async function pesquisarServicoCenti(pedido) {
  let etapa = 'conferir_formulario', interacaoIniciada = false, pesquisaAcionada = false,
    selecaoAcionada = false, selecionado = false, observador, detalhesSelecao = null;
  const falhar = m => { throw Error(m); };
  const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  const cnpj = s => String(s ?? '').replace(/\D/g, '');
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const visivel = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const unico = (lista, mensagem) => { if (lista.length !== 1) falhar(mensagem); return lista[0]; };
  const habilitado = e => {
    if (!visivel(e) || e.disabled || e.readOnly) falhar('Controle ausente ou desabilitado.');
    const r = e.getBoundingClientRect(), p = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    if (r.width <= 0 || r.height <= 0 || !(p === e || e.contains(p))) falhar('Deixe os controles visíveis e sem outra janela sobre eles.');
    return e;
  };
  try {
    if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) falhar('Abra a Centi de Caetité.');
    if (pedido?.conferido !== true || pedido.ausenciaConferida !== true
        || !/^\d{14}$/.test(cnpj(pedido.cnpjEsperado)) || cnpj(pedido.cnpjEsperado) !== cnpj(pedido.cnpjConfirmado)) {
      falhar('Confira a empresa e a ausência do serviço, inclusive páginas, filtros e serviços herdados.');
    }
    const s = pedido.servico;
    if (!s || !/^[1-9]\d*$/.test(String(s.id)) || !/^\d{2}\.\d{2}\.\d{3}$/.test(s.codigo)
        || !['2,00', '4,00', '5,00'].includes(s.aliquota) || typeof s.nome !== 'string' || !s.nome.trim()) falhar('Serviço inválido.');
    if ([...document.querySelectorAll('input[type=password]')].some(visivel)) falhar('Entre na Centi antes da pesquisa.');
    const primario = unico([...document.querySelectorAll('input[id^="IdServico"]')].filter(e => !e.id.endsWith('-second') && visivel(e)), 'Abra somente um formulário novo de Serviço.');
    const sufixo = primario.id.slice('IdServico'.length);
    const campo = id => unico([...document.querySelectorAll('[id]')].filter(e => e.id === id && visivel(e)), 'Os campos do formulário mudaram ou não são únicos.');
    const conferirVinculo = () => {
      if (campo('IdServico' + sufixo) !== primario || !campo('Id' + sufixo).readOnly || campo('Id' + sufixo).value.trim() !== '0') falhar('A pesquisa exige o mesmo vínculo novo, com Id 0.');
    };
    const conferir = () => {
      conferirVinculo();
      if (!['', '0'].includes(primario.value.trim()) || campo('IdServico' + sufixo + '-second').value.trim()) falhar('O vínculo já contém um serviço.');
    };
    conferir();
    const datasAntes = pedido.selecionar === true ? {
      inicio: campo('DataInicio' + sufixo).value, fim: campo('DataFim' + sufixo).value
    } : null;
    const secundario = campo('IdServico' + sufixo + '-second');
    const grades = () => [...document.querySelectorAll('.wj-flexgrid.tableFilterSearch--modal')].filter(visivel);
    if (grades().length) falhar('Feche a lupa antes de iniciar a pesquisa.');
    const grupo = secundario.closest('.input-right');
    const lupa = unico(grupo ? [...grupo.querySelectorAll('.iconSearchReference')].filter(visivel) : [], 'A lupa de Serviço não foi identificada.');
    etapa = 'abrir_lupa'; habilitado(lupa); interacaoIniciada = true; lupa.click();
    let limite = Date.now() + 8000;
    while (!grades().length) { conferir(); if (Date.now() >= limite) falhar('A lupa não abriu.'); await esperar(100); }
    function filtros() {
      conferir();
      const grade = unico(grades(), 'Deixe somente uma lupa de Serviço aberta.');
      const panel = grade.closest('[role=tabpanel]');
      if (!panel) falhar('O painel da pesquisa mudou.');
      const linhas = [...panel.querySelectorAll('.rowFilter')].filter(e => e.querySelector('.colCamposFilter select'));
      if (linhas.length !== 2) falhar('A pesquisa deve apresentar exatamente dois filtros.');
      const campoDa = l => unico([...l.querySelectorAll('.colCamposFilter select')].filter(visivel), 'Filtro Campo não identificado.');
      const situacao = unico(linhas.filter(l => campoDa(l).value === 'Situacao'), 'Filtro Situação não identificado.');
      const codigo = unico(linhas.filter(l => l !== situacao), 'Filtro Código não identificado.');
      const operacao = l => unico([...l.querySelectorAll('.colOperationFilter select')].filter(visivel), 'Operação do filtro não identificada.');
      return {grade, panel, codigo, situacao, campo: campoDa(codigo), operacao: operacao(codigo), opSituacao: operacao(situacao)};
    }
    const definir = (e, valor) => {
      habilitado(e); e.focus();
      Object.getOwnPropertyDescriptor(e.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(e, valor);
      e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); e.blur();
    };
    const opcao = (e, texto) => unico([...e.options].filter(o => normal(o.textContent) === normal(texto) && !o.disabled), `Opção ${texto} não identificada.`).value;
    const escolher = (e, texto) => definir(e, opcao(e, texto));
    etapa = 'filtros'; escolher(filtros().campo, 'Código'); await esperar(100);
    escolher(filtros().operacao, 'Contendo'); await esperar(100);
    const valorCodigo = () => unico([...filtros().codigo.querySelectorAll('.colFilterFilter input:not([type=hidden])')].filter(visivel), 'Valor do Código não identificado.');
    definir(valorCodigo(), s.codigo); await esperar(100);
    escolher(filtros().opSituacao, 'Igual'); await esperar(100);
    const valorSituacao = () => unico([...filtros().situacao.querySelectorAll('.colFilterFilter select')].filter(visivel), 'Valor da Situação não identificado.');
    escolher(valorSituacao(), 'Ativo'); await esperar(100);
    const f = filtros();
    if (f.campo.value !== opcao(f.campo, 'Código') || f.operacao.value !== opcao(f.operacao, 'Contendo')
        || valorCodigo().value !== s.codigo || f.opSituacao.value !== opcao(f.opSituacao, 'Igual')
        || valorSituacao().value !== opcao(valorSituacao(), 'Ativo')) falhar('A Centi não manteve os filtros solicitados.');
    const botao = unico([...f.panel.querySelectorAll('button.btnPesquisar')].filter(visivel), 'Botão Pesquisar não identificado.');
    if (normal(botao.textContent) !== 'PESQUISAR') falhar('A ação de pesquisa não corresponde ao esperado.');
    let atualizado = false, ultimaMudanca = 0;
    observador = new MutationObserver(lista => {
      if (lista.some(m => (m.target.nodeType === 1 ? m.target : m.target.parentElement)?.closest?.('.tableFilterSearch--modal')
          || [...m.addedNodes, ...m.removedNodes].some(n => n.nodeType === 1 && (n.matches?.('.tableFilterSearch--modal') || n.querySelector?.('.tableFilterSearch--modal'))))) {
        atualizado = true; ultimaMudanca = Date.now();
      }
    });
    observador.observe(f.panel.parentElement || f.panel, {subtree: true, childList: true, characterData: true});
    etapa = 'pesquisar'; habilitado(botao); pesquisaAcionada = true; botao.click();
    etapa = 'aguardar_resultados'; limite = Date.now() + 12000;
    while (true) {
      conferir();
      if (grades().length) {
        const atual = filtros();
        const linhas = [...atual.grade.querySelectorAll('.wj-cells > .wj-row')].filter(visivel)
          .map(l => [...l.children].filter(c => c.matches('.wj-cell')));
        const resultados = linhas.filter(c => c.length >= 4 && normal(c[0].textContent) === String(s.id)
          && normal(c[1].textContent) === s.codigo && normal(c[2].textContent) === normal(s.nome)
          && normal(c[3].textContent).replace('.', ',') === s.aliquota);
        const botaoAtual = unico([...atual.panel.querySelectorAll('button.btnPesquisar')].filter(visivel), 'Botão Pesquisar mudou.');
        if (atualizado && Date.now() - ultimaMudanca >= 350 && resultados.length === 1 && !botaoAtual.disabled) {
          habilitado(resultados[0][0]);
          if (pedido.selecionar !== true) return {ok: true, salvo: false, selecionado: false, etapa: 'pesquisa_conferida', interacaoIniciada, pesquisaAcionada, pesquisaAtualizada: true,
              mensagem: 'Pesquisa atualizada com uma linha exata. Nenhum serviço foi selecionado e nenhum botão Salvar foi acionado.'};
          etapa = 'selecionar_servico'; conferir();
          // A grade real manteve a primeira linha (5%) destacada apesar dos
          // eventos sintéticos. Usar a API pública e conferir a seleção antes
          // do duplo clique; não acessar propriedades privadas do Wijmo.
          const controle = globalThis.wijmo?.Control?.getControl?.(atual.grade);
          detalhesSelecao = {apiWijmoDisponivel: Boolean(controle), linhaConferida: false};
          if (!controle || typeof controle.select !== 'function' || typeof controle.getCellData !== 'function') {
            falhar('A API pública da grade Wijmo não está disponível nesta tela. Nenhum duplo clique foi acionado.');
          }
          const colunas = Array.from(controle.columns || []);
          const coluna = aliases => unico(colunas.map((c, i) => ({c, i}))
            .filter(({c}) => aliases.includes(normal(c.header)) || aliases.includes(normal(c.binding))), 'As colunas da API Wijmo não correspondem à pesquisa.').i;
          const indices = [coluna(['ID']), coluna(['CODIGO', 'CODIGO COMPLETO', 'CODIGOCOMPLETO']), coluna(['NOME']), coluna(['ALIQUOTA', 'ALIQUOTA (%)'])];
          const coincide = i => {
            const valores = indices.map(col => normal(controle.getCellData(i, col, true)));
            return valores[0] === String(s.id) && valores[1] === s.codigo && valores[2] === normal(s.nome) && valores[3].replace('.', ',') === s.aliquota;
          };
          const indicesLinhas = Array.from(controle.rows || [], (_, i) => i).filter(coincide);
          const indiceLinha = unico(indicesLinhas, 'A API da grade não confirmou um único registro exato.');
          controle.select(indiceLinha, indices[0]);
          if (typeof controle.scrollIntoView === 'function') controle.scrollIntoView(indiceLinha, indices[0]);
          if (typeof controle.focus === 'function') controle.focus();
          await esperar(100); conferir();
          if (controle.selection?.row !== indiceLinha || !coincide(indiceLinha)) falhar('A grade não manteve a seleção do registro esperado. Nenhum duplo clique foi acionado.');
          detalhesSelecao = {apiWijmoDisponivel: true, linhaConferida: true, indiceLinha, idMunicipal: String(s.id), aliquota: s.aliquota};
          const atuais = [...atual.grade.querySelectorAll('.wj-cells > .wj-row')].filter(visivel)
            .map(l => [...l.children].filter(c => c.matches('.wj-cell')))
            .filter(c => c.length >= 4 && normal(c[0].textContent) === String(s.id) && normal(c[1].textContent) === s.codigo
              && normal(c[2].textContent) === normal(s.nome) && normal(c[3].textContent).replace('.', ',') === s.aliquota);
          const celula = habilitado(unico(atuais, 'A linha mudou após a seleção na grade.')[0]), rect = celula.getBoundingClientRect();
          selecaoAcionada = true;
          celula.dispatchEvent(new MouseEvent('dblclick', {bubbles: true, cancelable: true, view: window, button: 0, detail: 2,
            clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2}));
          etapa = 'conferir_servico';
          const fimSelecao = Date.now() + 8000;
          while (true) {
            conferirVinculo();
            const idServico = primario.value.trim(), nome = campo('IdServico' + sufixo + '-second').value;
            if (!grades().length && [String(s.id), s.codigo].includes(idServico) && normal(nome) === normal(s.nome)) {
              const dataInicio = campo('DataInicio' + sufixo).value, dataFim = campo('DataFim' + sufixo).value;
              if (dataInicio !== datasAntes.inicio || dataFim !== datasAntes.fim) falhar('As datas mudaram durante a seleção. Confira o formulário antes de continuar.');
              selecionado = true;
              return {ok: true, salvo: false, selecionado, selecaoAcionada, etapa: 'servico_conferido', interacaoIniciada, pesquisaAcionada,
                pesquisaAtualizada: true, datasPreservadas: true, conferenciaParcial: true, detalhesSelecao,
                campos: {idVinculo: '0', idServico, nome, dataInicio, dataFim},
                mensagem: 'Serviço selecionado por duplo clique, ID e descrição conferidos. Datas preservadas. Confira os demais campos; nenhum botão Salvar foi acionado.'};
            }
            if (Date.now() >= fimSelecao) {
              detalhesSelecao.formularioAoFinal = {lupasVisiveis: grades().length, idServico, nome,
                dataInicio: campo('DataInicio' + sufixo).value, dataFim: campo('DataFim' + sufixo).value};
              falhar('Não foi possível confirmar o serviço no formulário após o duplo clique.');
            }
            await esperar(100);
          }
        }
      }
      if (Date.now() >= limite) falhar(atualizado ? 'Não houve uma linha única com ID, código, nome e alíquota esperados.' : 'Não foi observada atualização da grade; resultados antigos não foram aceitos.');
      await esperar(100);
    }
  } catch (e) {
    return {ok: false, salvo: false, selecionado, selecaoAcionada, etapa, interacaoIniciada, pesquisaAcionada, detalhesSelecao,
      mensagem: e.message + (selecaoAcionada ? ' O campo Serviço pode ter sido alterado; confira o formulário. Nenhum botão Salvar foi acionado.'
        : interacaoIniciada ? ' A lupa ou os filtros podem ter sido alterados. Nenhum botão Salvar foi acionado.' : ' Nenhuma ação foi iniciada.')};
  } finally { observador?.disconnect(); }
}
