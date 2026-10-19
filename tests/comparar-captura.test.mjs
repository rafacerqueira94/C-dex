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

test('serviço já preenchido com ID 0 não é confundido com ausente ou salvo', () => {
  const c = {...captura([]), vinculosPendentes: [{...vinculo, idVinculo: '0'}]};
  const r = compararCaptura(plano, c, [registro], cnpj);
  assert.equal(r.servicos[0].situacao, 'preenchido_sem_salvar');
  assert.equal(r.totalVinculosPendentes, 1);
  assert.equal(r.totalVinculosVisiveis, 0);
  assert.equal(r.podePreencher, false);
});
test('vínculos salvo e pendente para o mesmo serviço são conflito', () => {
  const c = {...captura([vinculo]), vinculosPendentes: [{...vinculo, idVinculo: '0'}]};
  assert.equal(compararCaptura(plano, c, [registro], cnpj).servicos[0].situacao, 'conflito');
});
test('dois vínculos novos iguais não são eliminados como cópia visual', () => {
  const p = {...vinculo, idVinculo: '0'};
  const c = {...captura([]), vinculosPendentes: [p, {...p}]};
  const r = compararCaptura(plano, c, [registro], cnpj);
  assert.equal(r.servicos[0].situacao, 'conflito');
  assert.equal(r.totalVinculosPendentes, 2);
});
test('pendência desconhecida é destacada e ID 0 não pode entrar como vínculo salvo', () => {
  const c = {...captura([]), vinculosPendentes: [{...vinculo, idVinculo: '0', nome: 'SEM CORRESPONDÊNCIA'}]};
  assert.equal(compararCaptura(plano, c, [registro], cnpj).vinculosSemIdentificacao.length, 1);
  assert.throws(() => compararCaptura(plano, captura([{...vinculo, idVinculo: '0'}]), [registro], cnpj));
});

test('Serviço exibido como ID municipal resolve sem usar o ID do vínculo', () => {
  const c = captura([{...vinculo, idVinculo: '16192', nome: '219'}]);
  const r = compararCaptura(plano, c, [registro], cnpj);
  assert.equal(r.servicos[0].situacao, 'localizado');
  assert.deepEqual(r.servicos[0].idsVinculos, ['16192']);
  assert.deepEqual(r.servicos[0].formasIdentificacao, ['id_municipal']);
  assert.equal(r.vinculosSemIdentificacao.length, 0);
});
test('ID do vínculo jamais substitui referência desconhecida na coluna Serviço', () => {
  const c = captura([{...vinculo, idVinculo: '219', nome: '16192'}]);
  const r = compararCaptura(plano, c, [registro], cnpj);
  assert.equal(r.servicos[0].situacao, 'nao_localizado_na_captura');
  assert.equal(r.vinculosSemIdentificacao.length, 1);
});
test('referência numérica ambígua ou inativa não é aceita como correspondência', () => {
  const outro = {...registro, Id: '300', CodigoCompleto: '07.08.000'};
  for (const extras of [[outro,{...outro,CodigoCompleto:'07.09.000'}],[{...outro,Situacao:'Inativo'}]]) {
    const r = compararCaptura(plano, captura([{...vinculo,nome:'300'}]), [registro,...extras], cnpj);
    assert.equal(r.servicos[0].situacao, 'nao_localizado_na_captura');
    assert.equal(r.vinculosSemIdentificacao.length, 1);
  }
});
test('referência numérica em vínculo Id 0 continua pendente, não localizado como salvo', () => {
  const c = {...captura([]), vinculosPendentes:[{...vinculo,idVinculo:'0',nome:'219'}]};
  assert.equal(compararCaptura(plano,c,[registro],cnpj).servicos[0].situacao,'preenchido_sem_salvar');
});
test('código sem alíquota e números parciais não recebem correspondência por aproximação', () => {
  for (const nome of ['07.07.000','219abc','0219']) {
    const r = compararCaptura(plano,captura([{...vinculo,nome}]),[registro],cnpj);
    assert.equal(r.vinculosSemIdentificacao.length,1);
  }
});
