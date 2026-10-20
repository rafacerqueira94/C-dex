"""Percurso AR022, CPF/CNPJ e abertura de empresa em DOM simulado."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Empresa(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        cls.search=(ROOT/'pesquisar-empresa-centi.mjs').read_text().replace('export async function','async function',1)
        cls.inspect=(ROOT/'conectar-centi.mjs').read_text().split('export function inspecionarConexaoCenti()',1)[1]
        cls.inspect='function inspecionarConexaoCenti()'+cls.inspect
        cls.open=(ROOT/'abrir-empresa-centi.mjs').read_text().replace('export async function','async function',1)
    @classmethod
    def tearDownClass(cls):cls.browser.close();cls.p.stop()
    def setUp(self):
        self.page=self.browser.new_page(viewport={'width':1400,'height':1000})
        self.page.route('**/*',lambda r:r.fulfill(status=200,body='<html></html>'));self.page.goto('https://ba.centi.com.br/caetite/')
        self.page.set_content('''<style>.wj-cell{display:inline-block;width:170px;height:30px}input,select{margin:3px}</style>
        <a id="arrec">Arrecadação</a><a id="econ" hidden>Atividade econômica</a><a id="card" hidden>Atividade econômica AR022</a>
        <div id="pesquisa" hidden><div class="rowFilter"><div class="colCamposFilter"><select><option>Razão social</option></select></div><div class="colOperationFilter"><select><option>Contendo</option></select></div><div class="colFilterFilter"><input value="filtro anterior"></div></div>
        <div class="rowFilter"><div class="colCamposFilter"><select><option>CPF/CNPJ</option></select></div><div class="colOperationFilter"><select><option>Contendo</option></select></div><div class="colFilterFilter"><input id="cpf"></div></div>
        <button class="btnPesquisar">Pesquisar</button>
        <div class="wj-flexgrid"><div class="wj-colheaders"><div class="wj-cell">ID</div><div class="wj-cell">Razão social</div><div class="wj-cell">CPF/CNPJ</div></div><div class="wj-cells"></div></div></div><div id="cadastro"></div>
        <script>
        window.cliques=[];window.modo='normal';
        document.querySelector('#arrec').onclick=()=>{cliques.push('arrec');document.querySelector('#econ').hidden=false};
        document.querySelector('#econ').onclick=()=>{cliques.push('econ');document.querySelector('#card').hidden=false};
        document.querySelector('#card').onclick=()=>{cliques.push('ar022');document.querySelector('#pesquisa').hidden=false};
        const row=()=>'<div class="wj-row"><div class="wj-cell">82242</div><div class="wj-cell">EMPRESA TESTE</div><div class="wj-cell">11.222.333/0001-81</div></div>';
        document.querySelector('.btnPesquisar').onclick=()=>{cliques.push('pesquisar');setTimeout(()=>{document.querySelector('.wj-cells').innerHTML=modo==='vazio'?'<div>Sem resultados</div>':modo==='duplicado'?row()+row():row()},20)};
        const controle={columns:[{header:'ID'},{header:'Razão social'},{header:'CPF/CNPJ'}],get rows(){return [...document.querySelectorAll('.wj-cells .wj-row')]},selection:{row:0},select(i,c){this.selection={row:i,col:c}},getCellData(i,c){return this.rows[i].children[c].textContent},scrollIntoView(){}};
        window.wijmo={Control:{getControl:()=>controle}};
        document.querySelector('.wj-cells').ondblclick=()=>{cliques.push('abrir');document.querySelector('#cadastro').textContent='Atividade econômica - '+(modo==='errada'?'999':'82242');document.querySelector('#pesquisa').hidden=true};
        </script>''')
    def tearDown(self):self.page.close()
    def pesquisar(self):return self.page.evaluate('async p=>{'+self.search+';return pesquisarEmpresaCenti(p)}',{'cnpj':'11222333000181'})
    def abrir(self,p):return self.page.evaluate('async p=>{'+self.open+';return abrirEmpresaCenti(p)}',p)
    def test_menu_card_search_exact_company_and_double_click(self):
        r=self.pesquisar();self.assertTrue(r['ok'],r);self.assertEqual(r['idEmpresa'],'82242')
        self.assertEqual(self.page.locator('#cpf').input_value(),'11.222.333/0001-81')
        self.assertEqual(self.page.evaluate('cliques'),['arrec','econ','ar022','pesquisar'])
        self.assertTrue(self.abrir(r)['empresaConferida'])
    def test_ar022_card_can_be_div_with_delegated_listener(self):
        self.page.evaluate("""()=>{
          document.querySelector('#card').remove();
          const card=document.createElement('div');card.id='card';card.hidden=true;
          card.innerHTML='<span>Atividade econômica</span><span>AR022</span><span>VÍDEO</span>';
          document.body.append(card);
          document.body.addEventListener('click',e=>{if(card.contains(e.target)){cliques.push('ar022');document.querySelector('#pesquisa').hidden=false}});
        }""")
        r=self.pesquisar();self.assertTrue(r['ok'],r)
        self.assertEqual(self.page.evaluate('cliques'),['arrec','econ','ar022','pesquisar'])
    def test_real_sidebar_subitem_div_does_not_require_arrecadacao_click(self):
        self.page.evaluate("""()=>{
          document.querySelector('#arrec').remove();document.querySelector('#econ').remove();
          const item=document.createElement('div');item.className='sidebarSubItens';
          item.innerHTML='<span>Atividade econômica</span>';document.body.prepend(item);
          document.body.addEventListener('click',e=>{if(item.contains(e.target)){cliques.push('econ');document.querySelector('#card').hidden=false}});
        }""")
        r=self.pesquisar();self.assertTrue(r['ok'],r)
        self.assertEqual(self.page.evaluate('cliques'),['econ','ar022','pesquisar'])
    def test_no_result_or_duplicates_do_not_open_company(self):
        for modo in ['vazio','duplicado']:
            self.page.evaluate('m=>window.modo=m',modo);r=self.pesquisar();self.assertFalse(r['ok'])
            self.assertNotIn('abrir',self.page.evaluate('cliques'))
    def test_mismatched_result_cnpj_is_not_opened(self):
        r=self.pesquisar();r['cnpj']='99999999999999'
        self.assertFalse(self.abrir(r)['ok']);self.assertNotIn('abrir',self.page.evaluate('cliques'))
    def test_pending_changes_prevent_navigation(self):
        self.page.evaluate("()=>{const b=document.createElement('button');b.textContent='Salvar(1)';document.body.append(b)}")
        self.assertFalse(self.pesquisar()['ok']);self.assertEqual(self.page.evaluate('cliques'),[])
    def test_connection_diagnostic_does_not_export_field_values(self):
        self.pesquisar()
        d=self.page.evaluate('()=>{'+self.inspect+';return inspecionarConexaoCenti()}')
        import json
        texto=json.dumps(d)
        self.assertNotIn('11.222.333/0001-81',texto)
        self.assertNotIn('filtro anterior',texto)
        self.page.evaluate("()=>{const e=document.createElement('input');e.type='password';e.value='segredo';document.body.append(e)}")
        d=self.page.evaluate('()=>{'+self.inspect+';return inspecionarConexaoCenti()}')
        self.assertEqual(d,{'estado':'aguardando_login'})
if __name__=='__main__':unittest.main()
