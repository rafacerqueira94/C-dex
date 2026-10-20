// Apenas navegação/pesquisa; não cria empresas nem salva alterações.
export async function pesquisarEmpresaCenti(pedido) {
  let etapa = 'abrir_pesquisa', observador, pesquisaAcionada = false;
  const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  const visivel = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const falhar = m => { throw Error(m); };
  const unico = (lista, m) => {if (lista.length !== 1) falhar(m);return lista[0];};
  const controles = () => [...document.querySelectorAll('a,button,[role=button],[onclick],[ng-click],[data-action]')].filter(visivel);
  const clicar = e => {
    if (e.disabled || e.getAttribute('aria-disabled') === 'true') falhar('Controle de navegação desabilitado.');
    const r = e.getBoundingClientRect(), alvo = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    if (!(alvo === e || e.contains(alvo))) falhar('O controle de navegação está coberto.');
    e.click();
  };
  const grade = () => {
    const grades = [...document.querySelectorAll('.wj-flexgrid')].filter(visivel).filter(g => {
      const titulos = [...g.querySelectorAll('.wj-colheaders .wj-cell')].map(e => normal(e.textContent));
      return titulos.includes('CPF/CNPJ') && titulos.includes('RAZAO SOCIAL') && titulos.includes('ID');
    });
    if (grades.length > 1) falhar('Há mais de uma pesquisa de empresa aberta.');
    return grades[0];
  };
  try {
    if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) falhar('Abra a Centi de Caetité.');
    if (!/^\d{14}$/.test(pedido?.cnpj)) falhar('CNPJ do cartão inválido.');
    if ([...document.querySelectorAll('input[type=password]')].some(visivel)) return {ok: false, etapa: 'aguardando_login', mensagem: 'Entre na Centi para continuar.'};
    if ([...document.querySelectorAll('button,[role=button]')].filter(visivel).some(e => /^SALVAR\s*\([1-9]\d*\)$/.test(normal(e.textContent)))) falhar('Há alterações pendentes. Não vou abandonar o cadastro aberto.');
    if (!grade()) {
      const cartao = controles().filter(e => /\bAR022\b/.test(normal(e.textContent)) && normal(e.textContent).includes('ATIVIDADE ECONOMICA'));
      if (cartao.length === 1) clicar(cartao[0]);
      else {
        let atividade = controles().filter(e => normal(e.textContent) === 'ATIVIDADE ECONOMICA');
        if (!atividade.length) {
          clicar(unico(controles().filter(e => normal(e.textContent) === 'ARRECADACAO'), 'O menu Arrecadação não foi identificado de forma única.'));
          await esperar(200);
          atividade = controles().filter(e => normal(e.textContent) === 'ATIVIDADE ECONOMICA');
        }
        clicar(unico(atividade, 'O menu Atividade econômica não foi identificado de forma única.'));
        const limite = Date.now() + 8000;
        while (!grade()) {
          const cards = controles().filter(e => /\bAR022\b/.test(normal(e.textContent)) && normal(e.textContent).includes('ATIVIDADE ECONOMICA'));
          if (cards.length === 1) {clicar(cards[0]);break;}
          if (Date.now() > limite) falhar('O cadastro Atividade econômica AR022 não foi identificado.');
          await esperar(100);
        }
      }
    }
    let limite = Date.now() + 8000;
    while (!grade()) {if (Date.now() > limite) falhar('A pesquisa AR022 não abriu.');await esperar(100);}
    etapa = 'filtro_cnpj';
    const linhas = [...document.querySelectorAll('.rowFilter')].filter(visivel);
    const campo = l => [...l.querySelectorAll('.colCamposFilter select')].filter(visivel)[0];
    const linha = unico(linhas.filter(l => normal(campo(l)?.selectedOptions[0]?.textContent) === 'CPF/CNPJ'), 'O filtro CPF/CNPJ não foi identificado de forma única.');
    const definir = (e, valor) => {
      if (!e || e.disabled || e.readOnly) falhar('Filtro ausente ou desabilitado.');
      Object.getOwnPropertyDescriptor(e.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(e, valor);
      e.dispatchEvent(new Event('input', {bubbles: true}));e.dispatchEvent(new Event('change', {bubbles: true}));
    };
    // Limpar somente os dois outros filtros de texto conhecidos da pesquisa.
    for (const outra of linhas.filter(l => l !== linha)) {
      const nome = normal(campo(outra)?.selectedOptions[0]?.textContent);
      const valores = [...outra.querySelectorAll('.colFilterFilter input')].filter(visivel);
      if (valores.some(e => e.value.trim()) && !['RAZAO SOCIAL', 'NOME FANTASIA'].includes(nome)) falhar('Há um filtro adicional preenchido que precisa ser identificado.');
      if (['RAZAO SOCIAL', 'NOME FANTASIA'].includes(nome)) valores.forEach(e => definir(e, ''));
    }
    const operacao = unico([...linha.querySelectorAll('.colOperationFilter select')].filter(visivel), 'Operação CPF/CNPJ não identificada.');
    const contem = unico([...operacao.options].filter(o => normal(o.textContent) === 'CONTENDO' && !o.disabled), 'Operação Contendo indisponível.');
    definir(operacao, contem.value);
    const valor = unico([...linha.querySelectorAll('.colFilterFilter input')].filter(visivel), 'Entrada CPF/CNPJ não identificada.');
    const c = pedido.cnpj, formatado = `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`;
    definir(valor, formatado);
    if (valor.value.replace(/\D/g, '') !== c) falhar('O filtro não manteve o CNPJ solicitado.');
    const pesquisar = unico([...document.querySelectorAll('button.btnPesquisar')].filter(visivel).filter(e => normal(e.textContent) === 'PESQUISAR'), 'O botão Pesquisar não foi identificado de forma única.');
    const g = grade();let atualizado = false, ultima = 0;
    observador = new MutationObserver(() => {atualizado = true;ultima = Date.now();});
    observador.observe(g, {subtree: true, childList: true, characterData: true});
    etapa = 'pesquisar_empresa';pesquisaAcionada = true;clicar(pesquisar);
    limite = Date.now() + 12000;
    while (Date.now() < limite) {
      if (atualizado && Date.now() - ultima >= 350 && !pesquisar.disabled) {
        const atual = grade();
        if (!atual) falhar('A grade da pesquisa foi substituída; confira a Centi.');
        const titulos = [...atual.querySelectorAll('.wj-colheaders .wj-cell')].map(e => normal(e.textContent));
        const indiceCnpj = titulos.indexOf('CPF/CNPJ'), indiceId = titulos.indexOf('ID');
        const encontrados = [...atual.querySelectorAll('.wj-cells > .wj-row')].filter(visivel).map(l => [...l.children].filter(e => e.matches('.wj-cell')))
          .filter(celulas => celulas[indiceCnpj]?.textContent.replace(/\D/g, '') === pedido.cnpj);
        if (encontrados.length > 1) falhar('O CNPJ retornou mais de um cadastro. Não foi escolhido um automaticamente.');
        if (encontrados.length === 1) {
          const idEmpresa = encontrados[0][indiceId]?.textContent.trim();
          if (!/^[1-9]\d*$/.test(idEmpresa)) falhar('O resultado não possui ID válido.');
          return {ok: true, etapa: 'empresa_localizada', cnpj: pedido.cnpj, idEmpresa, pesquisaAcionada};
        }
        return {ok: false, etapa: 'empresa_nao_localizada', pesquisaAcionada, mensagem: 'Nenhum cadastro com o CNPJ exato do cartão foi encontrado. Nenhuma empresa foi criada e nenhum serviço foi cadastrado.'};
      }
      await esperar(100);
    }
    falhar('A atualização da pesquisa da empresa não foi confirmada. Não foram usados resultados antigos.');
  } catch (e) {return {ok: false, etapa, pesquisaAcionada, mensagem: e.message};}
  finally {observador?.disconnect();}
}
