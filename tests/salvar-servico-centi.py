"""Salvamento em DOM simulado; não acessa o cadastro real."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

class Salvamento(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        cls.source = (Path(__file__).resolve().parents[1]/'salvar-servico-centi.mjs').read_text().replace('export async function', 'async function', 1)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.p.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.page.route('**/*', lambda r:r.fulfill(status=200,body='<html></html>'))
        self.page.goto('https://ba.centi.com.br/caetite/')
        self.page.set_content('''<input id="IdT" readonly value="0"><input id="IdServicoT" value="238">
        <input id="IdServicoT-second" value="SERVIÇO - 4%"><input id="DataInicioT" value="19/10/2026"><input id="DataFimT" value="">
        <select id="EspecificarCnaeT"><option>Não</option><option>Sim</option></select>
        <button onclick="window.cliques++;if(!window.semRetorno)document.querySelector('#IdT').value='16192'">Salvar(1)</button>
        <script>window.cliques=0</script>''')
        self.pedido = {'revisado':True,'somenteEstaPendencia':True,'cnpjEsperado':'11222333000181','cnpjConfirmado':'11.222.333/0001-81',
            'tentativa':'tentativa-1234567890','servico':{'id':'238','codigo':'09.02.000','aliquota':'4,00','nome':'SERVIÇO - 4%'},
            'campos':{'idVinculo':'0','dataInicio':'19/10/2026','dataFim':''}}

    def tearDown(self): self.page.close()
    def run_save(self): return self.page.evaluate('async p=>{'+self.source+';return salvarServicoCenti(p)}',self.pedido)
    def test_id_definitivo_and_single_click(self):
        r=self.run_save();self.assertTrue(r['salvo']);self.assertTrue(r['requerReleitura']);self.assertEqual(r['idVinculo'],'16192')
        self.page.locator('#IdT').evaluate("e=>e.value='0'")
        self.assertFalse(self.run_save()['ok']);self.assertEqual(self.page.evaluate('cliques'),1)
    def test_changed_service_dates_or_existing_id_blocks(self):
        for field,value in [('IdServicoT','740'),('DataInicioT','20/10/2026'),('IdT','123')]:
            original=self.page.locator('#'+field).input_value()
            self.page.locator('#'+field).evaluate('(e,v)=>e.value=v',value)
            self.assertFalse(self.run_save()['salvamentoAcionado'])
            self.page.locator('#'+field).evaluate('(e,v)=>e.value=v',original)
        self.assertEqual(self.page.evaluate('cliques'),0)
    def test_missing_or_yes_cnae_blocks(self):
        self.page.locator('select').select_option(label='Sim');self.assertFalse(self.run_save()['ok'])
        self.page.locator('select').evaluate('e=>e.remove()');self.assertFalse(self.run_save()['ok'])
        self.assertEqual(self.page.evaluate('cliques'),0)
    def test_multiple_pending_or_save_buttons_blocks(self):
        self.page.locator('button').evaluate("e=>e.textContent='Salvar(2)'")
        self.assertFalse(self.run_save()['ok'])
        self.page.locator('button').evaluate("e=>{e.textContent='Salvar(1)';e.after(e.cloneNode(true))}")
        self.assertFalse(self.run_save()['ok']);self.assertEqual(self.page.evaluate('cliques'),0)
    def test_cnae_with_explicit_label_and_different_id_is_identified(self):
        self.page.locator('select').evaluate("e=>{e.id='CnaeCustom';const l=document.createElement('label');l.htmlFor=e.id;l.textContent='Especificar cnae?';e.before(l)}")
        self.assertTrue(self.run_save()['salvo'])
    def test_ambiguous_cnae_label_blocks(self):
        self.page.locator('select').evaluate("e=>{const s=e.cloneNode(true);s.id='outro';const l=document.createElement('label');l.htmlFor=s.id;l.textContent='Especificar cnae?';e.after(l,s)}")
        self.assertFalse(self.run_save()['ok']);self.assertEqual(self.page.evaluate('cliques'),0)
    def test_company_and_review_required(self):
        for key,value in [('revisado',False),('somenteEstaPendencia',False),('cnpjConfirmado','99999999999999')]:
            before=self.pedido[key];self.pedido[key]=value;self.assertFalse(self.run_save()['ok']);self.pedido[key]=before
        self.assertEqual(self.page.evaluate('cliques'),0)
    def test_timeout_is_uncertain_without_retry(self):
        self.page.evaluate('window.semRetorno=true');self.page.clock.install()
        self.page.evaluate('p=>{'+self.source+';salvarServicoCenti(p).then(r=>window.resposta=r)}',self.pedido)
        self.page.clock.run_for(12500);self.page.wait_for_function('window.resposta')
        r=self.page.evaluate('resposta');self.assertIsNone(r['salvo']);self.assertTrue(r['salvamentoAcionado'])
        self.assertFalse(self.run_save()['ok']);self.assertEqual(self.page.evaluate('cliques'),1)

if __name__=='__main__': unittest.main()
