"""Um clique em Salvar(N) apenas após conferir a coleção atual."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
class Lote(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  cls.source=(Path(__file__).resolve().parents[1]/'salvar-lote-centi.mjs').read_text().replace('export async function','async function',1)
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.page=self.browser.new_page();self.page.route('**/*',lambda r:r.fulfill(status=200,body='<html></html>'));self.page.goto('https://ba.centi.com.br/caetite/')
  self.page.set_content('''<button id="btnFooterSalvarTESTE">Salvar(2)</button><div class="wj-flexgrid"></div><script>
  window.cliques=0;window.linhas=[['0','214','20/10/2026',''],['0','217','20/10/2026','']];
  const controle={columns:['ID','Serviço','Data início','Data fim'].map(header=>({header})),get rows(){return linhas},getCellData:(i,c)=>linhas[i][c]};
  window.wijmo={Control:{getControl:()=>controle}};document.querySelector('button').onclick=()=>cliques++;
  </script>''')
  self.pedido={'revisado':True,'cnpjEsperado':'11222333000181','cnpjConfirmado':'11222333000181','tentativa':'tentativa-identificada','capturaEsperada':{'registros':[],'vinculosPendentes':[{'idVinculo':'0','nome':n,'dataInicio':'20/10/2026','dataFim':''} for n in ['214','217']]}}
 def tearDown(self):self.page.close()
 def run_save(self):return self.page.evaluate('async p=>{'+self.source+';return salvarLoteCenti(p)}',self.pedido)
 def test_one_click_for_two_pending_and_no_repeat(self):
  r=self.run_save();self.assertTrue(r['ok'],r);self.assertTrue(r['requerReleitura']);self.assertEqual(self.page.evaluate('cliques'),1)
  self.assertFalse(self.run_save()['ok']);self.assertEqual(self.page.evaluate('cliques'),1)
 def test_date_caption_missing_is_identified_by_binding(self):
  self.page.evaluate("()=>{controle.columns[3]={header:'',binding:'DataFim'}}")
  self.assertTrue(self.run_save()['ok']);self.assertEqual(self.page.evaluate('cliques'),1)
 def test_external_pending_or_changed_dates_block(self):
  for script in ["linhas.push(['0','999','20/10/2026',''])","linhas[0][2]='01/01/2020'"]:
   self.page.evaluate(script);self.assertFalse(self.run_save()['ok']);self.assertEqual(self.page.evaluate('cliques'),0)
 def test_count_mismatch_disabled_or_dialog_block(self):
  self.page.locator('button').evaluate("e=>e.textContent='Salvar(3)'");self.assertFalse(self.run_save()['ok'])
  self.page.locator('button').evaluate("e=>{e.textContent='Salvar(2)';e.disabled=true}");self.assertFalse(self.run_save()['ok'])
  self.page.locator('button').evaluate('e=>e.disabled=false');self.page.evaluate("()=>{const d=document.createElement('div');d.setAttribute('role','dialog');d.textContent='Modal';document.body.append(d)}");self.assertFalse(self.run_save()['ok']);self.assertEqual(self.page.evaluate('cliques'),0)
if __name__=='__main__':unittest.main()
