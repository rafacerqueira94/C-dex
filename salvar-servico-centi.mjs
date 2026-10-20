// Autocontida para execução na aba Centi. Uma tentativa, sem repetição automática.
export async function salvarServicoCenti(pedido) {
  let salvamentoAcionado = false;
  const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  const visivel = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const falhar = m => { throw Error(m); };
  const unico = (lista, m) => { if (lista.length !== 1) falhar(m); return lista[0]; };
  try {
    if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) falhar('Abra a Centi de Caetité.');
    if (pedido?.revisado !== true || pedido?.somenteEstaPendencia !== true
        || !/^\d{14}$/.test(pedido.cnpjEsperado) || pedido.cnpjEsperado !== String(pedido.cnpjConfirmado).replace(/\D/g, '')) falhar('Confira a empresa, o formulário e a ausência de outras alterações pendentes.');
    const s = pedido.servico, antes = pedido.campos;
    if (!s || !/^[1-9]\d*$/.test(String(s.id)) || !/^\d{2}\.\d{2}\.\d{3}$/.test(s.codigo)
        || !['2,00', '4,00', '5,00'].includes(s.aliquota) || !s.nome?.trim()
        || antes?.idVinculo !== '0' || typeof antes.dataInicio !== 'string' || typeof antes.dataFim !== 'string') falhar('Seleção conferida ausente ou inválida.');
    if ([...document.querySelectorAll('input[type=password], .tableFilterSearch--modal, [role=dialog]')].some(visivel)) falhar('Feche as janelas e mantenha o formulário conferido aberto.');
    const primario = unico([...document.querySelectorAll('input[id^="IdServico"]')].filter(e => !e.id.endsWith('-second') && visivel(e)), 'Mantenha somente um formulário de Serviço visível.');
    const sufixo = primario.id.slice('IdServico'.length);
    const campo = id => unico([...document.querySelectorAll('[id]')].filter(e => e.id === id && visivel(e)), 'O formulário mudou ou seus campos não são únicos.');
    const id = campo('Id' + sufixo);
    const conferir = novo => {
      if (campo('IdServico' + sufixo) !== primario || campo('Id' + sufixo) !== id || !id.readOnly
          || (novo && id.value.trim() !== '0')) falhar('O vínculo conferido mudou.');
      if (![String(s.id), s.codigo].includes(primario.value.trim()) || normal(campo('IdServico' + sufixo + '-second').value) !== normal(s.nome)
          || campo('DataInicio' + sufixo).value !== antes.dataInicio || campo('DataFim' + sufixo).value !== antes.dataFim) falhar('Serviço ou datas mudaram após a conferência.');
    };
    conferir(true);
    // Não inferir o valor pelo índice ou por valores booleanos internos da Centi.
    const cnae = unico([...document.querySelectorAll('select[id]')].filter(e => e.id === 'EspecificarCnae' + sufixo && visivel(e)), 'O campo Especificar CNAE não foi identificado. É necessário mapear esse campo antes de salvar automaticamente.');
    if (normal(cnae.selectedOptions[0]?.textContent) !== 'NAO') falhar('Especificar CNAE deve estar como Não neste fluxo.');
    const botao = unico([...document.querySelectorAll('button, [role=button], input[type=submit]')].filter(e => visivel(e)
      && /^SALVAR\s*\(1\)$/.test(normal(e.tagName === 'INPUT' ? e.value : e.textContent))), 'Não foi identificado um único botão Salvar(1). Nenhum salvamento foi iniciado.');
    if (botao.disabled || botao.getAttribute('aria-disabled') === 'true') falhar('Salvar está desabilitado.');
    const rect = botao.getBoundingClientRect(), alvo = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    if (!(alvo === botao || botao.contains(alvo))) falhar('O botão Salvar está coberto.');
    if (typeof pedido.tentativa !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(pedido.tentativa)) falhar('Identificador da tentativa inválido.');
    const tentativas = globalThis.__ponteCentiSalvamentos ??= new Set();
    if (tentativas.has(pedido.tentativa)) falhar('Esta tentativa já foi acionada. Releia a lista antes de qualquer nova ação.');
    conferir(true);
    tentativas.add(pedido.tentativa); salvamentoAcionado = true; botao.click();
    const limite = Date.now() + 12000;
    while (Date.now() < limite) {
      conferir(false);
      const definitivo = id.value.trim();
      if (/^[1-9]\d*$/.test(definitivo)) return {ok: true, salvo: true, salvamentoAcionado, etapa: 'id_definitivo_observado',
        idVinculo: definitivo, requerReleitura: true,
        mensagem: `Salvamento acionado uma vez. ID definitivo ${definitivo} observado no formulário. Volte à pasta Serviços e refaça a comparação para confirmar o vínculo na lista.`};
      await new Promise(r => setTimeout(r, 100));
    }
    falhar('Não foi observado um ID definitivo após o salvamento.');
  } catch (e) {
    return {ok: false, salvo: salvamentoAcionado ? null : false, salvamentoAcionado, requerReleitura: salvamentoAcionado,
      etapa: salvamentoAcionado ? 'persistencia_nao_confirmada' : 'salvamento_bloqueado',
      mensagem: e.message + (salvamentoAcionado ? ' O resultado é incerto. Não repita o salvamento; releia Serviços e confira a Centi.' : ' Nenhum botão Salvar foi acionado.')};
  }
}
