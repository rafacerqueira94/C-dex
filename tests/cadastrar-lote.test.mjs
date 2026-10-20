import test from 'node:test';
import assert from 'node:assert/strict';
import {cadastrarLote} from '../cadastrar-lote.mjs';
const catalogo=[{Id:'214',CodigoCompleto:'07.02.000',Nome:'EXECUCAO - 4%',Aliquota:'4,00',Situacao:'Ativo'},{Id:'217',CodigoCompleto:'07.05.000',Nome:'REFORMA - 4%',Aliquota:'4,00',Situacao:'Ativo'}];
const plano={tipo:'lista_servicos_conferida',conferidoPeloOperador:true,empresa:{cnpj:'11222333000181'},servicos:catalogo.map(s=>({id:s.Id,codigo:s.CodigoCompleto,aliquota:s.Aliquota}))};
const entrada={plano,catalogo,cnpj:plano.empresa.cnpj,ausenciaConferida:true};
function cenario(){
 const registros=[],pendentes=[],eventos=[];
 const io={ler:async()=>({tipo:'captura_vinculos_centi',registros:structuredClone(registros),vinculosPendentes:structuredClone(pendentes),linhasNaoInterpretadas:0}),
 navegar:async(acao)=>{eventos.push(acao);return {ok:true}},
 selecionar:async({servico})=>({ok:true,selecionado:true,datasPreservadas:true,campos:{idVinculo:'0',dataInicio:'20/10/2026',dataFim:'',nome:servico.nome}}),
 conferir:async({servico})=>{eventos.push('conferir');pendentes.push({idVinculo:'0',nome:String(servico.id),dataInicio:'20/10/2026',dataFim:''});return {ok:true}},
 salvarLote:async()=>{eventos.push('salvar');registros.push(...pendentes.splice(0).map((v,i)=>({...v,idVinculo:String(100+i)})));return {ok:true,salvo:true,salvamentoAcionado:true}},
 dataInicio:()=> '20/10/2026',identificador:()=> 'tentativa-identificada'};
 return {io,registros,pendentes,eventos};
}
test('dois serviços são preenchidos antes de um único salvamento e releitura',async()=>{
 const c=cenario(),r=await cadastrarLote(entrada,c.io);assert.equal(r.concluido,true,r.mensagem);assert.equal(r.resultadoIncerto,false);assert.equal(c.registros.length,2);
 assert.deepEqual(c.eventos,['novo','conferir','lista','novo','conferir','lista','salvar']);
 assert.equal((await cadastrarLote(entrada,c.io)).concluido,true);assert.equal(c.eventos.filter(e=>e==='salvar').length,1);
});
test('pendência anterior impede Novo e Salvar',async()=>{const c=cenario();c.pendentes.push({idVinculo:'0',nome:'214'});assert.equal((await cadastrarLote(entrada,c.io)).ok,false);assert.deepEqual(c.eventos,[])});
test('pendência externa durante o lote interrompe sem salvar',async()=>{const c=cenario(),conferir=c.io.conferir;c.io.conferir=async p=>{const r=await conferir(p);c.pendentes.push({idVinculo:'0',nome:'999'});return r};assert.equal((await cadastrarLote(entrada,c.io)).ok,false);assert.equal(c.eventos.includes('salvar'),false)});
test('falha no segundo formulário preserva primeiro pendente sem salvar',async()=>{const c=cenario(),selecionar=c.io.selecionar;let n=0;c.io.selecionar=async p=>++n===2?{ok:false}:selecionar(p);assert.equal((await cadastrarLote(entrada,c.io)).ok,false);assert.equal(c.pendentes.length,1);assert.equal(c.eventos.includes('salvar'),false)});
test('falha depois do clique marca incerteza sem repetir',async()=>{const c=cenario();let n=0;c.io.salvarLote=async()=>{n++;return {ok:false,salvo:null,salvamentoAcionado:true}};const r=await cadastrarLote(entrada,c.io);assert.equal(r.resultadoIncerto,true);assert.equal(n,1)});
test('aguarda IDs definitivos na releitura sem repetir o clique',async()=>{
 const c=cenario(),ler=c.io.ler;let enviado=false,n=0;
 c.io.salvarLote=async()=>{enviado=true;c.eventos.push('salvar');return {ok:true,salvo:true,salvamentoAcionado:true}};
 c.io.ler=async()=>{if(enviado&&++n===3)c.registros.push(...c.pendentes.splice(0).map((v,i)=>({...v,idVinculo:String(100+i)})));return ler()};
 const r=await cadastrarLote(entrada,c.io);assert.equal(r.concluido,true);assert.equal(c.eventos.filter(e=>e==='salvar').length,1);assert.equal(n,3);
});
test('preserva existentes e adiciona somente o ausente',async()=>{
 const c=cenario();c.registros.push({idVinculo:'90',nome:'214',dataInicio:'01/01/2020',dataFim:''});
 const r=await cadastrarLote(entrada,c.io);assert.equal(r.concluido,true,r.mensagem);assert.equal(c.registros.length,2);assert.equal(c.eventos.filter(e=>e==='conferir').length,1);assert.equal(c.registros[0].idVinculo,'90');
});
