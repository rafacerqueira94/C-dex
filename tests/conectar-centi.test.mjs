import test from 'node:test';
import assert from 'node:assert/strict';
import {conectarCenti, URL_CENTI} from '../conectar-centi.mjs';
import {guardarPlanoDaAba, receberPlanoDaAba} from '../fluxo-pdf.mjs';
function api(abas){const criadas=[];return {criadas,tabs:{query:async filtro=>{assert.equal(filtro.url,'https://ba.centi.com.br/caetite/*');return abas;},create:async config=>{criadas.push(config);return {id:44};}}};}
test('Centi fechada abre a página sem precisar do clique na aba do sistema',async()=>{const a=api([]);assert.deepEqual(await conectarCenti(a),{aba:44,criada:true});assert.equal(a.criadas[0].url,URL_CENTI);});
test('uma aba existente é reutilizada',async()=>{const a=api([{id:12}]);assert.deepEqual(await conectarCenti(a),{aba:12,criada:false});assert.equal(a.criadas.length,0);});
test('várias abas usam a vinculada ou abrem outra sem escolher cadastro arbitrário',async()=>{const a=api([{id:12},{id:13}]);assert.equal((await conectarCenti(a,13)).aba,13);assert.equal((await conectarCenti(a)).aba,44);});
test('PDF pode atravessar as telas antes de existir uma aba Centi',()=>{const m=new Map();const storage={setItem:(k,v)=>m.set(k,v),getItem:k=>m.get(k),removeItem:k=>m.delete(k)};const plano={tipo:'lista_servicos_conferida',conferidoPeloOperador:true};guardarPlanoDaAba(storage,plano,null,1000);assert.deepEqual(receberPlanoDaAba(storage,null,2000),plano);});
