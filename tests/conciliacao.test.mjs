import test from 'node:test';
import assert from 'node:assert/strict';
import {conciliarServicos, normalizarVinculosCenti} from '../conciliacao.mjs';
import {readFileSync} from 'node:fs';

const servico = {codigo: '01.01.000', id: '123', aliquota: '4,00'};
const plano = {tipo: 'lista_servicos_conferida', conferidoPeloOperador: true, servicos: [servico]};
const completa = {leituraCompleta: true};

test('leitura completa vazia permite preparar o serviço pendente', () => {
  const r = conciliarServicos(plano, [], completa);
  assert.equal(r.podePreencher, true);
  assert.equal(r.pendentes.length, 1);
});
test('serviço já cadastrado é excluído dos pendentes, inclusive ID numérico', () => {
  const r = conciliarServicos(plano, [{...servico, id: 123}], completa);
  assert.equal(r.jaCadastrados.length, 1);
  assert.equal(r.pendentes.length, 0);
});
for (const [nome, registros] of [
  ['mesmo código e outro registro', [{...servico, id: '456'}]],
  ['mesmo registro e outro código', [{...servico, codigo: '01.02.000'}]],
  ['alíquota divergente', [{...servico, aliquota: '5,00'}]],
  ['cadastro duplicado', [{...servico}, {...servico}]]
]) test(nome + ' bloqueia o preenchimento', () => {
  const r = conciliarServicos(plano, registros, completa);
  assert.equal(r.podePreencher, false);
  assert.equal(r.conflitos.length, 1);
  assert.equal(r.pendentes.length, 0);
});
test('leitura incompleta ou sem identificação não autoriza inclusão', () => {
  for (const r of [conciliarServicos(plano, []), conciliarServicos(plano, [{codigo: servico.codigo}], completa)]) {
    assert.equal(r.podePreencher, false);
    assert.equal(r.bloqueados.length, 1);
    assert.equal(r.pendentes.length, 0);
  }
});
test('rejeita lista não conferida ou repetida', () => {
  assert.throws(() => conciliarServicos({...plano, conferidoPeloOperador: false}, [], completa));
  assert.throws(() => conciliarServicos({...plano, servicos: [servico, servico]}, [], completa));
});
test('comparação não modifica o plano nem os registros fornecidos', () => {
  const entrada = structuredClone(plano), registros = [{...servico}];
  conciliarServicos(entrada, registros, completa);
  assert.deepEqual(entrada, plano);
  assert.deepEqual(registros, [servico]);
});

const catalogo = [{Id: '123', CodigoCompleto: '01.01.000', Aliquota: '4,00', Situacao: 'Ativo'}];
test('normalização separa ID de vínculo do ID municipal antes de conciliar', () => {
  const vinculados = normalizarVinculosCenti([{idVinculo: '2592', codigo: servico.codigo, aliquota: '4,00'}], catalogo);
  assert.equal(vinculados[0].idVinculo, '2592');
  assert.equal(vinculados[0].id, '123');
  assert.equal(conciliarServicos(plano, vinculados, completa).jaCadastrados.length, 1);
});
test('catálogo ambíguo ou sem correspondência bloqueia a comparação', () => {
  for (const base of [[], [...catalogo, {...catalogo[0], Id: '456'}]]) {
    const vinculados = normalizarVinculosCenti([{idVinculo: '2592', codigo: servico.codigo, aliquota: '4,00'}], base);
    assert.equal(vinculados[0].id, null);
    assert.equal(conciliarServicos(plano, vinculados, completa).podePreencher, false);
  }
});
test('ID municipal explicitamente lido deve coincidir com o catálogo', () => {
  const vinculo = {idVinculo: '2592', codigo: servico.codigo, aliquota: '4,00', idMunicipal: '999'};
  assert.equal(normalizarVinculosCenti([vinculo], catalogo)[0].id, null);
});
test('normalização rejeita vínculo novo e não altera os dados fornecidos', () => {
  const vinculo = {idVinculo: '2592', codigo: servico.codigo, aliquota: '4,00'};
  assert.throws(() => normalizarVinculosCenti([{...vinculo, idVinculo: '0'}], catalogo));
  const original = structuredClone(vinculo);
  normalizarVinculosCenti([vinculo], catalogo);
  assert.deepEqual(vinculo, original);
});
test('captura com serviço legado ausente do catálogo bloqueia inclusão automática', () => {
  const base = JSON.parse(readFileSync(new URL('../data/servicos-centi-extraido.json', import.meta.url)));
  const codigos = ['17.06.000','13.01.000','13.02.000','17.22.000','17.02.000','08.02.000'];
  // IDs sintéticos de vínculo: não incorporam os dados da empresa da captura.
  const vinculos = codigos.map((codigo, i) => ({idVinculo: String(10000 + i), codigo, aliquota: '4,00'}));
  const normalizados = normalizarVinculosCenti(vinculos, base);
  assert.equal(normalizados.length, 6);
  assert.equal(normalizados.filter(v => v.identificacao === 'catalogo_unico').length, 5);
  assert.equal(normalizados.find(v => v.codigo === '13.01.000').id, null);
  const planoDaCaptura = {...plano, servicos: normalizados.filter(v => v.id !== null)};
  const resultado = conciliarServicos(planoDaCaptura, normalizados, completa);
  assert.equal(resultado.podePreencher, false);
  assert.equal(resultado.pendentes.length, 0);
});
