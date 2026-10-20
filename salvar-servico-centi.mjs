// Autocontida para execução na aba Centi. Uma tentativa, sem repetição automática.
export async function salvarServicoCenti(pedido) {
  let salvamentoAcionado = false, diagnosticoCnae = null, diagnosticoSalvar = null;
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
    const selects = [...document.querySelectorAll('select')].filter(visivel);
    const peloId = selects.filter(e => ['EspecificarCnae' + sufixo, 'EspecificarCNAE' + sufixo].includes(e.id));
    const rotulos = [...document.querySelectorAll('label, span, div, td, th')]
      .filter(e => visivel(e) && /^ESPECIFICAR CNAE\s*[?:*]*$/.test(normal(e.textContent))
        && ![...e.children].some(c => /^ESPECIFICAR CNAE\s*[?:*]*$/.test(normal(c.textContent))));
    const associados = rotulos.flatMap(rotulo => {
      const explicitos = selects.filter(e => (rotulo.htmlFor && e.id === rotulo.htmlFor)
        || (rotulo.id && (e.getAttribute('aria-labelledby') || '').split(/\s+/).includes(rotulo.id))
        || rotulo.contains(e));
      if (explicitos.length) return explicitos;
      // O formulário pode usar divs para os títulos, sem label/for. Aceitar
      // somente o menor grupo com um select e sem campos de outro serviço.
      let grupo = rotulo.parentElement;
      for (let nivel = 0; grupo && nivel < 3; nivel++, grupo = grupo.parentElement) {
        if (grupo.contains(primario) || [...grupo.querySelectorAll('input, textarea')].some(visivel)) break;
        const campos = [...grupo.querySelectorAll('select')].filter(visivel);
        if (campos.length > 1) break;
        if (campos.length === 1) return campos;
      }
      return [];
    });
    const candidatos = [...new Set([...peloId, ...associados])];
    diagnosticoCnae = {rotulosEncontrados: rotulos.length, candidatos: candidatos.length,
      selectsVisiveis: selects.map(e => ({id: String(e.id).slice(0, 120),
        opcao: ['SIM', 'NAO'].includes(normal(e.selectedOptions[0]?.textContent)) ? normal(e.selectedOptions[0].textContent) : 'outra',
        associadoAoRotulo: associados.includes(e)}))};
    const cnae = unico(candidatos, 'O campo Especificar CNAE não foi identificado de forma única. O relatório inclui a estrutura desse campo para diagnóstico.');
    if (normal(cnae.selectedOptions[0]?.textContent) !== 'NAO') falhar('Especificar CNAE deve estar como Não neste fluxo.');
    const botao = unico([...document.querySelectorAll('button, [role=button], input[type=submit]')].filter(e => visivel(e)
      && /^SALVAR\s*\(1\)$/.test(normal(e.tagName === 'INPUT' ? e.value : e.textContent))), 'Não foi identificado um único botão Salvar(1). Nenhum salvamento foi iniciado.');
    if (botao.disabled || botao.getAttribute('aria-disabled') === 'true') falhar('Salvar está desabilitado.');
    if (botao.id.startsWith('btnFooterSalvar') && botao.id.slice('btnFooterSalvar'.length).replace(/-/g,'') !== sufixo.replace(/-/g,'')) falhar('O botão Salvar pertence a outro formulário.');
    botao.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    const limiteBotao = Date.now() + 3000;
    let livre = false;
    while (Date.now() < limiteBotao) {
      conferir(true);
      if (!botao.isConnected || botao.disabled || botao.getAttribute('aria-disabled') === 'true') falhar('O botão Salvar mudou ou foi desabilitado.');
      const rect = botao.getBoundingClientRect(), x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
      const alvo = document.elementFromPoint(x,y);
      diagnosticoSalvar = {abaVisivel:document.visibilityState === 'visible',
        botaoId:String(botao.id).slice(0,120),noViewport:rect.width>0 && rect.height>0 && x>=0 && y>=0 && x<innerWidth && y<innerHeight,
        alvo:alvo ? {tag:alvo.tagName.toLowerCase(),classes:[...alvo.classList].slice(0,8)} : null};
      if (diagnosticoSalvar.noViewport && (alvo === botao || botao.contains(alvo))) {livre=true;break;}
      await new Promise(r=>setTimeout(r,100));
    }
    if (!livre) {
      if (document.visibilityState !== 'visible') return {ok:false,salvo:false,salvamentoAcionado:false,ativacaoNecessaria:true,
        etapa:'ativar_aba_para_conferir_salvar',diagnosticoSalvar,
        mensagem:'A aba Centi precisa ficar visível para conferir o botão Salvar. Nenhum botão Salvar foi acionado.'};
      falhar('O botão Salvar continua coberto ou fora da área visível após a espera.');
    }
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
      diagnosticoCnae, diagnosticoSalvar, etapa: salvamentoAcionado ? 'persistencia_nao_confirmada' : 'salvamento_bloqueado',
      mensagem: e.message + (salvamentoAcionado ? ' O resultado é incerto. Não repita o salvamento; releia Serviços e confira a Centi.' : ' Nenhum botão Salvar foi acionado.')};
  }
}
