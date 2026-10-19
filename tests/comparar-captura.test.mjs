import test from 'node:test';
import assert from 'node:assert/strict';
import {compararCaptura} from '../comparar-captura.mjs';

const cnpj = '11222333000181';
const registro = {Id: '219', CodigoCompleto: '07.07.000', Nome: 'RECUPERAÇÃO - 4%', Aliquota: '4,00', Situacao: 'Ativo'};
const plano = {tipo: 'lista_servicos_conferida', conferidoPeloOperador: true, empresa: {cnpj},
  servicos: [{id: '219', codigo: '07.07.000', aliquota: '4,00'}]};
const captura = registros => ({tipo: 'captura_vinculos_centi', registros});
const vinculo = {idVinculo: '9999', nome: '  recuperacao   - 4% ', dataInicio: '18/11/2025', dataFim: ''};

test('compara por catálogo sem confundir ID do vínculo com ID municipal', () => {
  const r = compararCaptura(plano, captura([vinculo]), [registro], cnpj);
  assert.equal(r.servicos[0].situacao, 'localizado');
  assert.deepEqual(r.servicos[0].idsVinculos, ['9999']);
  assert.equal(r.podePreencher, false);
});
test('captura vazia não autoriza preencher nem declara serviço ausente do cadastro', () => {
  const r = compararCaptura(plano, captura([]), [registro], cnpj);
  assert.equal(r.servicos[0].situacao, 'nao_localizado_na_captura');
  assert.equal(r.podePreencher, false);
});
test('vínculo legado sem correspondência é preservado para revisão', () => {
  const r = compararCaptura(plano, captura([{...vinculo, nome: '(VETADO) - 4%'}]), [registro], cnpj);
  assert.equal(r.vinculosSemIdentificacao.length, 1);
  assert.equal(r.vinculosSemIdentificacao[0].identificacao, 'fora_do_catalogo');
  assert.equal(r.podePreencher, false);
});
test('descrição ambígua não é resolvida por aproximação', () => {
  const r = compararCaptura(plano, captura([vinculo]), [registro, {...registro, Id: '220', CodigoCompleto: '07.08.000'}], cnpj);
  assert.equal(r.vinculosSemIdentificacao[0].identificacao, 'ambigua');
});
test('dois vínculos para o mesmo código ou alíquota divergente geram conflito', () => {
  const duplicados = [vinculo, {...vinculo, idVinculo: '10000'}];
  assert.equal(compararCaptura(plano, captura(duplicados), [registro], cnpj).servicos[0].situacao, 'conflito');
  const outro = {...registro, Id: '300', Aliquota: '5,00', Nome: 'RECUPERAÇÃO - 5%'};
  const r = compararCaptura(plano, captura([{...vinculo, nome: outro.Nome}]), [registro, outro], cnpj);
  assert.equal(r.servicos[0].situacao, 'conflito');
});
test('rejeita CNPJ diferente, lista não conferida e registro municipal adulterado', () => {
  assert.throws(() => compararCaptura(plano, captura([]), [registro], '00000000000000'));
  assert.throws(() => compararCaptura({...plano, conferidoPeloOperador: false}, captura([]), [registro], cnpj));
  assert.throws(() => compararCaptura({...plano, servicos: [{...plano.servicos[0], id: '999'}]}, captura([]), [registro], cnpj));
});
test('não considera data fim como autorização para recadastrar ou altera os dados', () => {
  const v = {...vinculo, dataFim: '01/01/2026'};
  const antes = structuredClone(v);
  const r = compararCaptura(plano, captura([v]), [registro], cnpj);
  assert.equal(r.servicos[0].situacao, 'localizado');
  assert.equal(r.podePreencher, false);
  assert.deepEqual(v, antes);
});
