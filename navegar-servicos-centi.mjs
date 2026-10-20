// Navegação conservadora usando apenas controles visíveis e rótulos exatos.
export async function navegarServicosCenti(pedido) {
  let interacaoIniciada = false;
  const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  const visivel = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const falhar = m => { throw Error(m); };
  const unicos = lista => [...new Set(lista)];
  const inputs = () => [...document.querySelectorAll('input[id^="IdServico"]')].filter(e => !e.id.endsWith('-second') && visivel(e));
  const grades = () => [...document.querySelectorAll('.wj-flexgrid')].filter(visivel).filter(g => {
    const textos = [...g.querySelectorAll('.wj-colheaders .wj-cell')].filter(visivel).map(e => normal(e.textContent));
    return ['ID', 'SERVICO', 'DATA INICIO', 'DATA FIM'].every(t => textos.includes(t));
  });
  try {
    if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) falhar('Abra a Centi de Caetité.');
    if ([...document.querySelectorAll('input[type=password], .tableFilterSearch--modal, [role=dialog]')].some(visivel)) falhar('Feche janelas e lupas antes de continuar.');
    const controles = [...document.querySelectorAll('button, [role=button], input[type=submit]')].filter(visivel);
    if (controles.some(e => /^SALVAR\s*\([1-9]\d*\)$/.test(normal(e.textContent || e.value)))) falhar('Há alterações pendentes na Centi. Confira-as antes de iniciar outro vínculo.');
    let alvo;
    if (pedido?.acao === 'novo') {
      if (inputs().length || grades().length !== 1) falhar('A tabela da pasta Serviços precisa estar visível antes de Novo.');
      const novos = controles.filter(e => normal(e.textContent || e.value) === 'NOVO');
      if (novos.length !== 1) falhar('Não identifiquei um único botão Novo para a tabela Serviços.');
      alvo = novos[0];
    } else if (pedido?.acao === 'lista') {
      if (!inputs().length && grades().length === 1) return {ok: true, interacaoIniciada: false};
      for (const e of inputs()) {
        const id = document.getElementById('Id' + e.id.slice('IdServico'.length));
        if (!id?.readOnly || !/^[1-9]\d*$/.test(id.value.trim())) falhar('Existe vínculo sem ID definitivo; não vou sair do formulário.');
      }
      const pastas = unicos([...document.querySelectorAll('a, span, [role=treeitem]')]
        .filter(e => visivel(e) && !e.children.length && normal(e.textContent) === 'SERVICOS')
        .map(e => e.closest('.divTreeSelected') || e.closest('a, [role=treeitem]') || e));
      if (pastas.length !== 1) falhar('Não identifiquei uma única pasta Serviços para reler a lista.');
      alvo = pastas[0];
    } else falhar('Ação de navegação inválida.');
    if (alvo.disabled || alvo.getAttribute('aria-disabled') === 'true') falhar('Controle de navegação desabilitado.');
    const r = alvo.getBoundingClientRect(), centro = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    if (!(centro === alvo || alvo.contains(centro))) falhar('Deixe o controle de navegação visível e descoberto.');
    interacaoIniciada = true; alvo.click();
    const limite = Date.now() + 8000;
    while (Date.now() < limite) {
      if (pedido.acao === 'lista' && !inputs().length && grades().length === 1) return {ok: true, interacaoIniciada};
      if (pedido.acao === 'novo' && inputs().length === 1) {
        const p = inputs()[0], sufixo = p.id.slice('IdServico'.length);
        const id = document.getElementById('Id' + sufixo), nome = document.getElementById(p.id + '-second');
        if (id?.readOnly && id.value.trim() === '0' && ['', '0'].includes(p.value.trim()) && nome && !nome.value.trim()) return {ok: true, interacaoIniciada};
      }
      await new Promise(r => setTimeout(r, 100));
    }
    falhar('A navegação não retornou a tela esperada. Confira a Centi antes de continuar.');
  } catch (e) { return {ok: false, interacaoIniciada, etapa: pedido?.acao === 'lista' ? 'aguardar_lista_servicos' : 'aguardar_formulario_servico',
    diagnosticoNavegacao: {formulariosVisiveis: inputs().length, gradesCompativeis: grades().length,
      gradesVisiveis: [...document.querySelectorAll('.wj-flexgrid')].filter(visivel).map(g => ({
        cabecalhos: [...g.querySelectorAll('.wj-colheaders .wj-cell')].filter(visivel).map(c => {
          const texto = normal(c.textContent); return ['ID','SERVICO','DATA INICIO','DATA FIM'].includes(texto) ? texto : 'outro';
        }), linhasNoDom: g.querySelectorAll('.wj-cells > .wj-row').length}))}, mensagem: e.message}; }
}
