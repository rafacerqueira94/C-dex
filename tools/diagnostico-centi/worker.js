import {inspecionarTelaCenti} from './inspecionar.mjs';

chrome.action.onClicked.addListener(async tab => {
  try {
    if (!tab.id) throw Error('Abra a aba da Centi.');
    const respostas = await chrome.scripting.executeScript({target: {tabId: tab.id}, func: inspecionarTelaCenti});
    const resultado = respostas[0]?.result;
    if (resultado?.tipo !== 'diagnostico_estrutura_centi') throw Error('O diagnóstico não retornou um relatório válido.');
    const json = JSON.stringify(resultado, null, 2);
    await chrome.downloads.download({
      url: 'data:application/json;charset=utf-8,' + encodeURIComponent(json),
      filename: `diagnostico-centi-${Date.now()}.json`, saveAs: true
    });
    await chrome.action.setBadgeText({tabId: tab.id, text: 'OK'});
    await chrome.action.setTitle({tabId: tab.id, title: 'Diagnóstico exportado. Nenhum campo foi alterado.'});
  } catch (e) {
    if (tab.id) {
      await chrome.action.setBadgeText({tabId: tab.id, text: '!'});
      await chrome.action.setTitle({tabId: tab.id, title: `Diagnóstico não concluído: ${e.message}`});
    }
  }
});
