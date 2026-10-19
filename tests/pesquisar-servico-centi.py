"""Pesquisa reconstruída em DOM simulado, sem acesso à Centi real."""
import json
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright


class PesquisaCenti(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        cls.source = (Path(__file__).resolve().parents[1] / 'pesquisar-servico-centi.mjs').read_text().replace('export async function', 'async function', 1)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()

    def setUp(self):
        self.page = self.browser.new_page(viewport={'width': 1400, 'height': 1000})
        self.page.route('**/*', lambda r: r.fulfill(status=200, content_type='text/html', body='<html></html>'))
        self.page.goto('https://ba.centi.com.br/caetite/')
        self.pedido = {'conferido': True, 'ausenciaConferida': True,
                       'cnpjEsperado': '11222333000181', 'cnpjConfirmado': '11.222.333/0001-81',
                       'servico': {'id': '238', 'codigo': '09.02.000', 'nome': 'SERVIÇO DE TESTE - 4%', 'aliquota': '4,00'}}
        self.page.set_content('''<style>.wj-cell{display:inline-block;width:230px;height:30px}input,select,button{margin:4px}</style>
        <input id="IdTESTE" readonly value="0"><input id="IdServicoTESTE" value="">
        <div class="input-right"><input id="IdServicoTESTE-second" value=""><button class="iconSearchReference">Lupa</button></div>
        <input id="DataInicioTESTE" value="19/10/2026"><input id="DataFimTESTE" value="">
        <button id="salvar">Salvar</button><div id="modal" style="display:none" role="tabpanel">
        <div class="rowFilter"><div class="colCamposFilter"><select><option value="Nome">Nome</option><option value="CodigoCompleto">Código</option></select></div>
        <div class="colOperationFilter"><select><option value="igual">Igual</option><option value="contem">Contendo</option></select></div>
        <div class="colFilterFilter"><input value=""></div></div>
        <div class="rowFilter"><div class="colCamposFilter"><select><option value="Situacao">Situação</option></select></div>
        <div class="colOperationFilter"><select><option value="diferente">Diferente</option><option value="igual">Igual</option></select></div>
        <div class="colFilterFilter"><select><option value="inativo">Inativo</option><option value="ativo">Ativo</option></select></div></div>
        <button class="btnPesquisar">Pesquisar</button>
        <div class="wj-flexgrid tableFilterSearch--modal"><div class="wj-cells" id="resultados"></div></div></div>
        <script>
        window.salvos=0;window.selecionados=0;window.pesquisas=0;window.lupas=0;window.modo='atualizar';
        const row=()=>'<div class="wj-row"><div class="wj-cell">238</div><div class="wj-cell">09.02.000</div><div class="wj-cell">SERVIÇO DE TESTE - 4%</div><div class="wj-cell">4,00</div></div>';
        const controle={columns:[{header:'ID',binding:'Id'},{header:'Código',binding:'CodigoCompleto'},{header:'Nome',binding:'Nome'},{header:'Alíquota',binding:'Aliquota'}],
          get rows(){return [...document.querySelectorAll('#resultados .wj-row')]},selection:{row:0},
          getCellData(i,c){return this.rows[i].children[c].textContent},
          select(i,c){if(!window.ignorarSelecao)this.selection={row:i,col:c}},focus(){},scrollIntoView(){}};
        window.wijmo={Control:{getControl:()=>controle}};
        document.querySelector('#resultados').innerHTML=row();
        document.querySelector('#salvar').onclick=()=>window.salvos++;
        document.querySelector('#resultados').onclick=()=>window.selecionados++;
        document.querySelector('#resultados').ondblclick=()=>{
          document.querySelector('#IdServicoTESTE').value=window.modo==='codigo'?'09.02.000':window.modo==='selecaoErrada'?'999':controle.getCellData(controle.selection.row,0);
          document.querySelector('#IdServicoTESTE-second').value=controle.getCellData(controle.selection.row,2);
          if(window.modo==='alterarDatas')document.querySelector('#DataInicioTESTE').value='01/01/2020';
          document.querySelector('#modal').style.display='none';
        };
        document.querySelector('.iconSearchReference').onclick=()=>{window.lupas++;document.querySelector('#modal').style.display='block'};
        document.querySelector('.btnPesquisar').onclick=()=>{window.pesquisas++;
          if(window.modo==='antigo')return;
          const html=window.modo==='tresAliquotas'?row().replace('238','740').replace('4%','5%').replace('4,00','5,00')+row().replace('238','494').replace('4%','2%').replace('4,00','2,00')+row():window.modo==='duplicado'?row()+row():window.modo==='errado'?row().replace('238','999'):row();
          setTimeout(()=>document.querySelector('#resultados').innerHTML=html,20);
        };
        </script>''')

    def tearDown(self):
        self.page.close()

    def run_search(self):
        return self.page.evaluate('async pedido => {'+self.source+';return await pesquisarServicoCenti(pedido);}', self.pedido)

    def test_success_only_searches_does_not_select_change_dates_or_save(self):
        r = self.run_search()
        self.assertTrue(r['ok'], r)
        self.assertEqual(r['etapa'], 'pesquisa_conferida')
        self.assertTrue(r['pesquisaAtualizada'])
        self.assertFalse(r['selecionado'])
        self.assertEqual(self.page.locator('#IdServicoTESTE').input_value(), '')
        self.assertEqual(self.page.locator('#DataInicioTESTE').input_value(), '19/10/2026')
        self.assertEqual(self.page.evaluate('salvos+selecionados'), 0)
        self.assertEqual(self.page.evaluate('pesquisas'), 1)

    def test_missing_absence_confirmation_has_no_interaction(self):
        self.pedido['ausenciaConferida'] = False
        r = self.run_search()
        self.assertFalse(r['ok']); self.assertFalse(r['interacaoIniciada'])
        self.assertEqual(self.page.evaluate('lupas+pesquisas+salvos'), 0)

    def test_rejects_existing_link_or_prefilled_service(self):
        for field, value in [('IdTESTE','12'), ('IdServicoTESTE','238')]:
            self.page.locator('#'+field).evaluate('(e,v)=>e.value=v', value)
            r = self.run_search()
            self.assertFalse(r['ok']); self.assertFalse(r['interacaoIniciada'])
            self.page.locator('#'+field).evaluate('(e,v)=>e.value=v', '0' if field=='IdTESTE' else '')

    def test_rejects_wrong_origin(self):
        self.page.goto('https://exemplo.com/caetite/')
        self.assertFalse(self.run_search()['ok'])

    def test_unchanged_wrong_or_duplicate_results_do_not_pass(self):
        # Três tentativas independentes; relógio virtual acelera somente o timeout.
        for modo in ['antigo', 'errado', 'duplicado']:
            self.page.evaluate('modo=>{window.modo=modo;document.querySelector("#modal").style.display="none";window.resposta=null;}', modo)
            self.page.clock.install()
            self.page.evaluate('pedido => {'+self.source+';window.pendente=pesquisarServicoCenti(pedido).then(r=>window.resposta=r);}', self.pedido)
            self.page.clock.run_for(800)
            self.page.clock.run_for(12500)
            self.page.wait_for_function('window.resposta !== null')
            r = self.page.evaluate('window.resposta')
            self.assertFalse(r['ok'], (modo, r))
            self.assertTrue(r['pesquisaAcionada'])
            self.assertFalse(r['selecionado'])
            self.assertEqual(self.page.evaluate('salvos+selecionados'), 0)

    def test_double_click_selects_and_verifies_service_without_saving(self):
        self.pedido['selecionar'] = True
        r = self.run_search()
        self.assertTrue(r['ok'], r)
        self.assertTrue(r['selecionado'])
        self.assertTrue(r['datasPreservadas'])
        self.assertEqual(r['etapa'], 'servico_conferido')
        self.assertEqual(r['campos']['idServico'], '238')
        self.assertEqual(r['campos']['dataInicio'], '19/10/2026')
        self.assertEqual(self.page.evaluate('salvos'), 0)

    def test_selection_accepts_full_code_returned_by_lookup(self):
        self.pedido['selecionar'] = True
        self.page.evaluate("window.modo='codigo'")
        r = self.run_search()
        self.assertTrue(r['ok'], r)
        self.assertEqual(r['campos']['idServico'], '09.02.000')

    def test_dates_changed_by_page_fail_verification_without_rollback_or_save(self):
        self.pedido['selecionar'] = True
        self.page.evaluate("window.modo='alterarDatas'")
        r = self.run_search()
        self.assertFalse(r['ok'])
        self.assertTrue(r['selecaoAcionada'])
        self.assertIn('datas mudaram', r['mensagem'])
        self.assertEqual(self.page.evaluate('salvos'), 0)

    def test_wrong_service_after_double_click_is_not_confirmed(self):
        self.pedido['selecionar'] = True
        self.page.evaluate("window.modo='selecaoErrada';window.resposta=null")
        self.page.clock.install()
        self.page.evaluate('pedido => {'+self.source+';pesquisarServicoCenti(pedido).then(r=>window.resposta=r);}', self.pedido)
        self.page.clock.run_for(1000)
        self.page.clock.run_for(8500)
        self.page.wait_for_function('window.resposta !== null')
        r = self.page.evaluate('window.resposta')
        self.assertFalse(r['ok'])
        self.assertFalse(r['selecionado'])
        self.assertTrue(r['selecaoAcionada'])
        self.assertEqual(self.page.evaluate('salvos'), 0)

    def test_three_rates_selects_third_row_238_instead_of_initial_740(self):
        self.pedido['selecionar'] = True
        self.page.evaluate("window.modo='tresAliquotas'")
        r = self.run_search()
        self.assertTrue(r['ok'], r)
        self.assertEqual(r['campos']['idServico'], '238')
        self.assertEqual(r['detalhesSelecao']['indiceLinha'], 2)
        self.assertTrue(r['detalhesSelecao']['linhaConferida'])
        self.assertEqual(self.page.evaluate('salvos'), 0)

    def test_unavailable_public_api_does_not_trigger_double_click(self):
        self.pedido['selecionar'] = True
        self.page.evaluate('window.wijmo=undefined')
        r = self.run_search()
        self.assertFalse(r['ok'])
        self.assertFalse(r['selecaoAcionada'])
        self.assertFalse(r['detalhesSelecao']['apiWijmoDisponivel'])
        self.assertEqual(self.page.locator('#IdServicoTESTE').input_value(), '')

    def test_selection_not_retained_by_grid_prevents_double_click(self):
        self.pedido['selecionar'] = True
        self.page.evaluate("window.modo='tresAliquotas';window.ignorarSelecao=true")
        r = self.run_search()
        self.assertFalse(r['ok'])
        self.assertFalse(r['selecaoAcionada'])
        self.assertIn('não manteve a seleção',r['mensagem'])
        self.assertEqual(self.page.locator('#IdServicoTESTE').input_value(), '')


if __name__ == '__main__': unittest.main()
