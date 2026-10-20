import test from 'node:test';
import assert from 'node:assert/strict';
import {cadastrarServicos} from '../cadastrar-servicos.mjs';
import {guardarPlanoDaAba, receberPlanoDaAba} from '../fluxo-pdf.mjs';
const catalogo = [
  {Id: '238', CodigoCompleto: '09.02.000', Nome: 'SERVICO A - 4%', Aliquota: '4,00', Situacao: 'Ativo'},
  {Id: '51', CodigoCompleto: '10.03.000', Nome: 'SERVICO B - 4%', Aliquota: '4,00', Situacao: 'Ativo'}
];
const plano = {tipo: 'lista_servicos_conferida', conferidoPeloOperador: true, empresa: {cnpj: '11222333000181'},
  servicos: catalogo.map(r => ({id: r.Id, codigo: r.CodigoCompleto, aliquota: r.Aliquota}))};
function cenario() {
  const registros = [], eventos = [];
  let atual;
  const io = {
    ler: async () => {eventos.push('ler');return {tipo: 'captura_vinculos_centi', registros: structuredClone(registros), linhasNaoInterpretadas: 0};},
    navegar: async acao => {eventos.push(acao);return {ok: true};},
    selecionar: async pedido => {atual = pedido.servico;eventos.push('selecionar:' + atual.id);return {ok: true, selecionado: true, datasPreservadas: true,
      campos: {idVinculo: '0', dataInicio: '20/10/2026', dataFim: '', nome: atual.nome}};},
    salvar: async () => {const id = String(100 + registros.length);eventos.push('salvar:' + atual.id);registros.push({idVinculo: id, nome: atual.id, dataInicio: '20/10/2026', dataFim: ''});return {ok: true, salvo: true, idVinculo: id};},
    dataInicio: () => '20/10/2026',
    identificador: () => 'identificador-de-teste'
  };
  return {io, registros, eventos};
}
const entrada = {plano, catalogo, cnpj: plano.empresa.cnpj, ausenciaConferida: true};
test('sequência cadastra e relê cada serviço antes do próximo; repetição ignora existentes', async () => {
  const {io,eventos,registros} = cenario();
  const r = await cadastrarServicos(entrada, io);
  assert.equal(r.concluido, true);assert.equal(registros.length,2);
  assert.ok(eventos.indexOf('lista') < eventos.indexOf('selecionar:51'));
  assert.equal(r.comparacao.servicos.every(s => s.situacao === 'localizado'), true);
  eventos.length = 0;
  assert.equal((await cadastrarServicos(entrada,io)).concluido,true);
  assert.equal(eventos.every(e => e === 'ler'),true);
});
test('confirmação ou CNPJ divergente bloqueiam antes de mutações', async () => {
  for(const dados of [{...entrada,ausenciaConferida:false},{...entrada,cnpj:'99999999999999'}]) {
    const {io,eventos}=cenario();const r=await cadastrarServicos(dados,io);
    assert.equal(r.ok,false);assert.equal(eventos.every(e=>e==='ler'),true);
  }
});
test('pendências, conflitos e linhas não interpretadas bloqueiam novos vínculos', async () => {
  for(const extra of [{vinculosPendentes:[{idVinculo:'0',nome:'238'}]}, {linhasNaoInterpretadas:1},
    {registros:[{idVinculo:'10',nome:'238'},{idVinculo:'11',nome:'238'}]}]) {
    const {io,eventos}=cenario();io.ler=async()=>({tipo:'captura_vinculos_centi',registros:[],...extra});
    assert.equal((await cadastrarServicos(entrada,io)).ok,false);assert.deepEqual(eventos,[]);
  }
});
test('seleção sem datas conferidas não salva', async () => {
  const {io,eventos}=cenario();io.selecionar=async()=>({ok:true,selecionado:true,campos:{idVinculo:'0'}});
  assert.equal((await cadastrarServicos(entrada,io)).ok,false);assert.equal(eventos.some(e=>e.startsWith('salvar:')),false);
});
test('data de início divergente impede salvamento automático', async () => {
  const {io,eventos}=cenario();io.dataInicio=()=> '21/10/2026';
  const r=await cadastrarServicos(entrada,io);assert.equal(r.ok,false);
  assert.equal(eventos.some(e=>e.startsWith('salvar:')),false);
});
test('falha de salvamento interrompe fila e preserva incerteza sem repetir', async () => {
  for(const falha of [async()=>{throw Error('Sem retorno');},async()=>({ok:false,salvo:null,salvamentoAcionado:true})]) {
    const {io,eventos}=cenario();io.salvar=falha;
    const r=await cadastrarServicos(entrada,io);assert.equal(r.resultadoIncerto,true);
    assert.equal(eventos.includes('selecionar:51'),false);assert.equal(eventos.includes('lista'),false);
  }
});
test('bloqueio anterior ao clique é registrado sem afirmar persistência incerta', async () => {
  const {io}=cenario();io.salvar=async()=>({ok:false,salvo:false,salvamentoAcionado:false,mensagem:'Campo ausente'});
  const r=await cadastrarServicos(entrada,io);assert.equal(r.ok,false);assert.equal(r.resultadoIncerto,false);
});
test('ID positivo no formulário sem confirmação na lista não permite próximo serviço', async () => {
  const {io,eventos}=cenario();io.salvar=async()=>({ok:true,salvo:true,idVinculo:'100'});
  const r=await cadastrarServicos(entrada,io);assert.equal(r.ok,false);assert.equal(r.etapa,'reler_servicos');
  assert.equal(eventos.includes('selecionar:51'),false);
});
test('plano do PDF passa na mesma sessão e aba, expira e é consumido uma única vez', () => {
  const m=new Map();const storage={setItem:(k,v)=>m.set(k,v),getItem:k=>m.get(k),removeItem:k=>m.delete(k)};
  guardarPlanoDaAba(storage,plano,12,1000);
  assert.deepEqual(receberPlanoDaAba(storage,12,2000),plano);assert.throws(()=>receberPlanoDaAba(storage,12,2000));
  guardarPlanoDaAba(storage,plano,12,1000);assert.throws(()=>receberPlanoDaAba(storage,13,2000));
  guardarPlanoDaAba(storage,plano,12,1000);assert.throws(()=>receberPlanoDaAba(storage,12,2000000));
});
