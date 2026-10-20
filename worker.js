chrome.action.onClicked.addListener(tab => {
  let naCenti = false;
  try {
    const url = new URL(tab.url);
    naCenti = url.origin === 'https://ba.centi.com.br' && url.pathname.startsWith('/caetite/');
  } catch { /* Sem URL da aba, abrir a consulta PDF. */ }
  const pagina = naCenti ? `consulta.html?aba=${tab.id}` : 'consulta.html';
  chrome.tabs.create({url: chrome.runtime.getURL(pagina)});
});
