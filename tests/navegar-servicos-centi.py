"""Navegação por controles visíveis em DOM simulado."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

class Navegacao(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        cls.source=(Path(__file__).resolve().parents[1]/'navegar-servicos-centi.mjs').read_text().replace('export async function','async function',1)
    @classmethod
    def tearDownClass(cls):cls.browser.close();cls.p.stop()
    def setUp(self):
        self.page=self.browser.new_page();self.page.route('**/*',lambda r:r.fulfill(status=200,body='<html></html>'));self.page.goto('https://ba.centi.com.br/caetite/')
        self.page.set_content('''<a id="pasta"><span>Serviços</span></a><button id="novo">Novo</button><button id="salvar">Salvar</button>
        <div id="lista" class="wj-flexgrid"><div class="wj-colheaders"><div class="wj-cell">ID</div><div class="wj-cell">Serviço</div><div class="wj-cell">Data início</div><div class="wj-cell">Data fim</div></div></div>
        <div id="form" hidden><input readonly id="IdT" value="0"><input id="IdServicoT"><input id="IdServicoT-second"></div>
        <script>window.cliques=0;
        document.querySelector('#novo').onclick=()=>{window.cliques++;document.querySelector('#lista').hidden=true;document.querySelector('#form').hidden=false};
        document.querySelector('#pasta').onclick=()=>{window.cliques++;document.querySelector('#lista').hidden=false;document.querySelector('#form').hidden=true};
        </script>''')
    def tearDown(self):self.page.close()
    def run_action(self,acao):return self.page.evaluate('async p=>{'+self.source+';return navegarServicosCenti(p)}',{'acao':acao})
    def test_new_waits_for_empty_id_zero_form(self):
        self.assertTrue(self.run_action('novo')['ok']);self.assertEqual(self.page.evaluate('cliques'),1)
        self.assertFalse(self.run_action('novo')['ok']);self.assertEqual(self.page.evaluate('cliques'),1)
    def test_list_preserves_pending_form_but_accepts_saved_id(self):
        self.run_action('novo');self.assertFalse(self.run_action('lista')['ok']);self.assertEqual(self.page.evaluate('cliques'),1)
        self.page.locator('#IdT').evaluate("e=>e.value='16192'")
        self.assertTrue(self.run_action('lista')['ok']);self.assertEqual(self.page.evaluate('cliques'),2)
    def test_multiple_new_buttons_or_other_pending_changes_block(self):
        self.page.locator('#salvar').evaluate("e=>e.textContent='Salvar(1)'")
        self.assertFalse(self.run_action('novo')['ok'])
        self.page.locator('#salvar').evaluate("e=>e.textContent='Salvar'")
        self.page.locator('#novo').evaluate('e=>e.after(e.cloneNode(true))')
        self.assertFalse(self.run_action('novo')['ok']);self.assertEqual(self.page.evaluate('cliques'),0)
    def test_real_tree_click_targets_selected_div_instead_of_text_span(self):
        self.page.evaluate("""()=>{
          document.querySelector('#lista').hidden=true;
          const antigo=document.querySelector('#pasta');antigo.remove();
          const row=document.createElement('div');row.className='rowTree normalRowTree row';
          row.innerHTML='<div class="divTreeSelected"><span>Serviços</span></div>';
          document.body.prepend(row);
          document.body.addEventListener('click',e=>{
            if(e.target.matches('.divTreeSelected')){window.cliques++;document.querySelector('#lista').hidden=false}
          });
        }""")
        self.assertTrue(self.run_action('lista')['ok']);self.assertEqual(self.page.evaluate('cliques'),1)
    def test_hidden_header_template_does_not_make_unrelated_grid_compatible(self):
        self.page.evaluate("""()=>{const g=document.querySelector('#lista').cloneNode(true);g.id='outraGrade';g.querySelector('.wj-colheaders').style.visibility='hidden';document.body.append(g)}""")
        self.assertTrue(self.run_action('lista')['ok']);self.assertEqual(self.page.evaluate('cliques'),0)
    def test_existing_list_does_not_click_navigation(self):
        self.assertTrue(self.run_action('lista')['ok']);self.assertEqual(self.page.evaluate('cliques'),0)

if __name__=='__main__':unittest.main()
