export const URL_CENTI = 'https://ba.centi.com.br/caetite/#/';

// host_permissions permite abrir/conectar sem depender de um clique na aba Centi.
export async function conectarCenti(api, preferida = null) {
  const abas = await api.tabs.query({url: 'https://ba.centi.com.br/caetite/*'});
  const aba = abas.find(a => a.id === preferida) || (abas.length === 1 ? abas[0] : null);
  if (aba) return {aba: aba.id, criada: false};
  // Com múltiplas abas, abrir uma dedicada evita operar no cadastro errado.
  const nova = await api.tabs.create({url: URL_CENTI, active: true});
  if (!Number.isSafeInteger(nova?.id)) throw Error('Não foi possível abrir a Centi.');
  return {aba: nova.id, criada: true};
}

// Diagnóstico somente estrutural: não devolve senhas, valores de campos ou CNPJs.
export function inspecionarConexaoCenti() {
  if (location.origin !== 'https://ba.centi.com.br' || !location.pathname.startsWith('/caetite/')) return {estado: 'fora_da_centi'};
  const visivel = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  if ([...document.querySelectorAll('input[type=password]')].some(visivel)) return {estado: 'aguardando_login'};
  const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  const conhecidos = new Set(['CNPJ', 'CPF/CNPJ', 'CPF / CNPJ', 'CPF OU CNPJ', 'CPF/CNPJ/CODIGO', 'ARRECADACAO', 'AR022', 'ATIVIDADE ECONOMICA', 'CONTRIBUINTE', 'SERVICOS', 'PESQUISAR', 'CODIGO', 'IGUAL', 'CONTENDO', 'NOVO', 'SALVAR', 'ATIVO']);
  const rotulo = e => {
    const texto = normal(e.textContent || e.value);
    return conhecidos.has(texto) ? texto : /^SALVAR\s*\(\d+\)$/.test(texto) ? 'SALVAR COM PENDENCIAS' : 'outro';
  };
  const controles = [...document.querySelectorAll('input:not([type=password]),select,button')].filter(visivel).map(e => ({
    tag: e.tagName.toLowerCase(), id: String(e.id || '').slice(0, 120), tipo: e.type,
    desabilitado: Boolean(e.disabled), somenteLeitura: Boolean(e.readOnly),
    rotulo: e.tagName === 'BUTTON' ? rotulo(e) : null,
    opcoesReconhecidas: e.tagName === 'SELECT' ? [...e.options].map(rotulo).filter(t => t !== 'outro') : []
  }));
  const rotulosVisiveis = [...new Set([...document.querySelectorAll('label,a,span,th,.wj-colheaders .wj-cell')].filter(visivel).map(rotulo).filter(t => t !== 'outro'))];
  const alvosNavegacao = [...document.querySelectorAll('a,span,div,li,button')].filter(visivel)
    .filter(e => conhecidos.has(normal(e.textContent)) && ![...e.children].some(c => normal(c.textContent) === normal(e.textContent)))
    .filter(e => ['ARRECADACAO','ATIVIDADE ECONOMICA','AR022','SERVICOS'].includes(normal(e.textContent)))
    .map(e => {
      const ancestrais = []; let p = e;
      for (let i=0;p && i<4;i++,p=p.parentElement) ancestrais.push({tag:p.tagName.toLowerCase(),
        id:String(p.id).slice(0,120),classes:[...p.classList].slice(0,8),role:p.getAttribute('role'),
        possuiOnclick:typeof p.onclick === 'function' || p.hasAttribute('onclick'),
        possuiTituloECodigo:/ATIVIDADE ECONOMICA/.test(normal(p.textContent)) && /\bAR022\b/.test(normal(p.textContent))});
      return {rotulo:normal(e.textContent),ancestrais};
    });
  return {tipo: 'diagnostico_conexao_centi', versao: 2, alvosNavegacao, estado: document.readyState === 'loading' || !rotulosVisiveis.length ? 'carregando' : 'tela_disponivel',
    somenteLeitura: true, controles,
    rotulosVisiveis,
    possuiFormularioServico: [...document.querySelectorAll('input[id^="IdServico"]')].some(visivel),
    possuiFiltros: [...document.querySelectorAll('.rowFilter')].some(visivel)};
}
