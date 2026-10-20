"""PDF real sintético → conferência → cadastro, com ações Chrome simuladas."""
import json
import mimetypes
import unittest
from pathlib import Path
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]

class FluxoPdf(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page = cls.browser.new_page()
        linhas = ['CADASTRO NACIONAL DA PESSOA JURIDICA','COMPROVANTE DE INSCRICAO E DE SITUACAO CADASTRAL',
          'NUMERO DE INSCRICAO','11.222.333/0001-81','NOME EMPRESARIAL','EMPRESA SINTETICA DE TESTE',
          'PORTE','DEMAIS','CODIGO E DESCRICAO DA ATIVIDADE ECONOMICA PRINCIPAL','62.01-5/00 - DESENVOLVIMENTO DE PROGRAMAS',
          'CODIGO E DESCRICAO DAS ATIVIDADES ECONOMICAS SECUNDARIAS','NAO INFORMADAS',
          'MUNICIPIO','CAETITE','UF','BA','SITUACAO CADASTRAL','ATIVA']
        page.set_content('<style>p{margin:0;height:22px;font-size:10px}</style>'+''.join('<p>'+x+'</p>' for x in linhas))
        cls.pdf = page.pdf(); page.close()
    @classmethod
    def tearDownClass(cls): cls.browser.close(); cls.p.stop()
    def setUp(self):
        self.ctx = self.browser.new_context(accept_downloads=True)
        def route(r):
            path=(ROOT/unquote(urlsplit(r.request.url).path).lstrip('/')).resolve()
            if not path.is_relative_to(ROOT) or not path.is_file(): return r.fulfill(status=404,body='Not found')
            r.fulfill(status=200,content_type='text/javascript' if path.suffix=='.mjs' else mimetypes.guess_type(path.name)[0] or 'application/octet-stream',body=path.read_bytes())
        self.ctx.route('https://ponte.test/**',route)
        self.page=self.ctx.new_page()
        self.page.add_init_script('''const dataTeste=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());window.chrome={scripting:{executeScript:async p=>{
          const estado=JSON.parse(sessionStorage.getItem('teste-centi')||'{"salvos":[],"acoes":[]}');
          estado.acoes.push(p.func.name);
          const salvar=()=>sessionStorage.setItem('teste-centi',JSON.stringify(estado));
          if(p.func.name==='lerVinculosCenti'){salvar();return [{result:{tipo:'captura_vinculos_centi',registros:estado.salvos,linhasNaoInterpretadas:0}}]}
          const pedido=p.args[0];
          if(p.func.name==='navegarServicosCenti'){estado.acoes.push(pedido.acao);salvar();return [{result:{ok:true}}]}
          if(p.func.name==='pesquisarServicoCenti'){
            salvar();return [{result:{ok:true,selecionado:true,datasPreservadas:true,campos:{idVinculo:'0',nome:pedido.servico.nome,dataInicio:dataTeste,dataFim:''}}}]
          }
          if(p.func.name==='salvarServicoCenti'){
            estado.salvos.push({idVinculo:String(100+estado.salvos.length),nome:String(pedido.servico.id),dataInicio:dataTeste,dataFim:''});salvar();
            return [{result:{ok:true,salvo:true,idVinculo:estado.salvos.at(-1).idVinculo}}]
          }
          throw Error('Ação inesperada');
        }}}''')
    def tearDown(self): self.ctx.close()
    def test_pdf_to_confirmed_persistence_without_json_import(self):
        self.page.goto('https://ponte.test/consulta.html?aba=123')
        self.page.locator('#arquivo-pdf').set_input_files({'name':'cartao-teste.pdf','mimeType':'application/pdf','buffer':self.pdf})
        self.page.locator('input[name=coworking][value=nao]').check()
        self.page.locator('#consultar').click()
        self.page.locator('#revisao').wait_for(state='visible')
        checks=self.page.locator('#servicos input[type=checkbox]:not([disabled])')
        self.assertGreater(checks.count(),0)
        checks.first.check()
        self.page.locator('#aceite').check();self.page.locator('#confirmar').click()
        self.page.locator('#continuar-centi').click()
        self.page.wait_for_url('**/integracao.html?aba=123&origem=pdf')
        self.assertTrue(self.page.locator('#lista').is_hidden())
        self.assertEqual(self.page.locator('#cnpj').input_value(),'11222333000181')
        self.assertTrue(self.page.locator('#cnpj').get_attribute('readonly') is not None)
        self.page.locator('#conferido').check();self.page.locator('#comparar').click()
        self.page.locator('#automatico').wait_for(state='visible')
        self.assertTrue(self.page.locator('#cadastrar-servicos').is_disabled())
        self.page.locator('#autorizar-cadastro').check();self.page.locator('#cadastrar-servicos').click()
        self.page.wait_for_function("document.querySelector('#status').textContent.includes('concluído e conferido')")
        estado=json.loads(self.page.evaluate("sessionStorage.getItem('teste-centi')"))
        self.assertEqual(len(estado['salvos']),1)
        self.assertEqual(estado['acoes'].count('salvarServicoCenti'),1)
        self.assertIn('novo',estado['acoes']);self.assertIn('lista',estado['acoes'])
        self.assertIn('Todos os serviços desta lista foram localizados',self.page.locator('#resumo').inner_text())
        with self.page.expect_download() as event:self.page.locator('#exportar-comparacao').click()
        resultado=json.loads(Path(event.value.path()).read_text())
        self.assertTrue(resultado['ultimoCadastro']['concluido'])
        self.assertEqual(resultado['servicos'][0]['situacao'],'localizado')

if __name__=='__main__': unittest.main()
