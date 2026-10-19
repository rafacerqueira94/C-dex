import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function abrir(tab) {
  let callback;
  const abertas = [];
  const chrome = {
    action: {onClicked: {addListener: f => { callback = f; }}},
    tabs: {create: config => abertas.push(config.url)},
    runtime: {getURL: p => 'chrome-extension://teste/' + p}
  };
  runInNewContext(readFileSync(new URL('../worker.js', import.meta.url), 'utf8'), {chrome, URL});
  callback(tab);
  return abertas;
}
test('ícone na Centi de Caetité abre comparação com a aba de origem', () => {
  assert.deepEqual(abrir({id: 12, url: 'https://ba.centi.com.br/caetite/#/'}), ['chrome-extension://teste/integracao.html?aba=12']);
});
test('outro site ou outro município mantém a abertura da consulta PDF', () => {
  for (const url of ['https://exemplo.com/', 'https://ba.centi.com.br/outro/', 'https://ba.centi.com.br.evil.example/caetite/']) {
    assert.deepEqual(abrir({id: 12, url}), ['chrome-extension://teste/consulta.html']);
  }
});
test('aba sem URL não interrompe o fluxo PDF', () => {
  assert.deepEqual(abrir({id: 12}), ['chrome-extension://teste/consulta.html']);
});
