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
        self.page.add_init_script('''const dataTeste=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());window.chrome={tabs:{query:async()=>[],create:async()=>({id:123})},scripting:{executeScript:async p=>{
          const estado=JSON.parse(sessionStorage.getItem('teste-centi')||'{"salvos":[],"acoes":[]}');
          estado.acoes.push(p.func.name);
          const salvar=()=>sessionStorage.setItem('teste-centi',JSON.stringify(estado));
          if(p.func.name==='lerVinculosCenti'){salvar();return [{result:{tipo:'captura_vinculos_centi',registros:estado.salvos,vinculosPendentes:estado.pendentes||[],linhasNaoInterpretadas:0}}]}
          if(p.func.name==='inspecionarConexaoCenti'){salvar();return [{result:window.loginConcluido?{estado:'tela_disponivel',possuiFormularioServico:false}:{estado:'aguardando_login'}}]}
          const pedido=p.args[0];
          if(p.func.name==='pesquisarEmpresaCenti'){salvar();return [{result:{ok:true,cnpj:pedido.cnpj,idEmpresa:'82242'}}]}
          if(p.func.name==='abrirEmpresaCenti'){salvar();return [{result:{ok:true,empresaConferida:true,cnpj:pedido.cnpj,idEmpresa:pedido.idEmpresa}}]}

          if(p.func.name==='navegarServicosCenti'){estado.acoes.push(pedido.acao);salvar();return [{result:{ok:true}}]}
          if(p.func.name==='pesquisarServicoCenti'){
            salvar();return [{result:{ok:true,selecionado:true,datasPreservadas:true,campos:{idVinculo:'0',nome:pedido.servico.nome,dataInicio:dataTeste,dataFim:''}}}]
          }
          if(p.func.name==='salvarLoteCenti'){
            estado.salvos.push(...(estado.pendentes||[]).map((v,i)=>({...v,idVinculo:String(100+estado.salvos.length+i)})));estado.pendentes=[];salvar();
            return [{result:{ok:true,salvo:true,salvamentoAcionado:true,requerReleitura:true}}]
          }
          if(p.func.name==='salvarServicoCenti'){
            if(pedido.conferirApenas){(estado.pendentes??=[]).push({idVinculo:'0',nome:String(pedido.servico.id),dataInicio:dataTeste,dataFim:''});salvar();return [{result:{ok:true,salvo:false}}]}
            estado.salvos.push({idVinculo:String(100+estado.salvos.length),nome:String(pedido.servico.id),dataInicio:dataTeste,dataFim:''});salvar();
            return [{result:{ok:true,salvo:true,idVinculo:estado.salvos.at(-1).idVinculo}}]
          }
          throw Error('Ação inesperada');
        }}}''')
    def tearDown(self): self.ctx.close()
    def importar_cartao(self, conectado=True):
        self.page.goto('https://ponte.test/consulta.html'+('?aba=123' if conectado else ''))
        self.page.locator('#arquivo-pdf').set_input_files({'name':'cartao-teste.pdf','mimeType':'application/pdf','buffer':self.pdf})
        self.page.locator('input[name=coworking][value=nao]').check()
        self.page.locator('#consultar').click()
        self.page.locator('#revisao').wait_for(state='visible')
        checks=self.page.locator('#servicos input[type=checkbox]:not([disabled])')
        self.assertGreater(checks.count(),0)
        checks.first.check()
        self.page.locator('#aceite').check();self.page.locator('#confirmar').click()
        self.page.locator('#continuar-centi').click()
        self.page.wait_for_url('**/integracao.html?aba=123&origem=pdf' if conectado else '**/integracao.html?origem=pdf')
        self.assertTrue(self.page.locator('#lista').is_hidden())
        self.assertEqual(self.page.locator('#cnpj').input_value(),'11222333000181')
        self.assertTrue(self.page.locator('#cnpj').get_attribute('readonly') is not None)
    def test_pdf_to_confirmed_persistence_without_json_import(self):
        self.importar_cartao()
        self.assertTrue(self.page.locator('#form-comparar').is_hidden())
        self.page.evaluate('window.loginConcluido=true')
        self.page.locator('#abrir-centi').click()
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

    def test_explicit_resume_saves_existing_pending_without_new(self):
        self.test_pdf_to_confirmed_persistence_without_json_import()
        self.page.evaluate("()=>{const e=JSON.parse(sessionStorage.getItem('teste-centi'));e.pendentes=e.salvos.map(v=>({...v,idVinculo:'0'}));e.salvos=[];e.acoes=[];sessionStorage.setItem('teste-centi',JSON.stringify(e))}")
        self.importar_cartao()
        self.page.locator('#opcoes-retomada summary').click()
        self.page.locator('#conferir-lote-pendente').check()
        self.page.locator('#retomar-lote').click()
        self.page.wait_for_function("document.querySelector('#status').textContent.includes('concluído e conferido')")
        estado=json.loads(self.page.evaluate("sessionStorage.getItem('teste-centi')"))
        self.assertEqual(estado['acoes'].count('salvarLoteCenti'),1)
        self.assertNotIn('novo',estado['acoes'])
        self.assertEqual(len(estado['salvos']),1)

    def test_start_with_centi_closed_keeps_pdf_plan_and_opens_login(self):
        self.importar_cartao(conectado=False)
        self.page.wait_for_function("document.querySelector('#status-conexao').textContent.includes('Entre na Centi')")
        self.assertEqual(self.page.locator('#cnpj').input_value(),'11222333000181')
        self.assertTrue(self.page.locator('#lista').is_hidden())
        self.assertEqual(self.page.locator('#arquivo-pdf').count(),0)

    def test_login_then_company_search_and_registration_continue_automatically(self):
        self.importar_cartao(conectado=False)
        self.page.wait_for_function("document.querySelector('#status-conexao').textContent.includes('Entre na Centi')")
        self.page.evaluate('window.loginConcluido=true')
        self.page.locator('#abrir-centi').click()
        self.page.wait_for_function("document.querySelector('#status').textContent.includes('concluído e conferido')")
        estado=json.loads(self.page.evaluate("sessionStorage.getItem('teste-centi')"))
        self.assertEqual(estado['acoes'].count('pesquisarEmpresaCenti'),1)
        self.assertEqual(estado['acoes'].count('abrirEmpresaCenti'),1)
        self.assertEqual(estado['acoes'].count('salvarServicoCenti'),1)
        self.assertEqual(len(estado['salvos']),1)

    def test_batch_saves_once_after_pending_list_is_checked(self):
        self.importar_cartao(conectado=False)
        self.page.evaluate('window.loginConcluido=true')
        self.page.locator('#abrir-centi').click()
        self.page.wait_for_function("document.querySelector('#status').textContent.includes('concluído e conferido')")
        estado=json.loads(self.page.evaluate("sessionStorage.getItem('teste-centi')"))
        self.assertEqual(estado['acoes'].count('salvarLoteCenti'),1)
        self.assertLess(estado['acoes'].index('salvarServicoCenti'),estado['acoes'].index('salvarLoteCenti'))
        self.assertEqual(estado['pendentes'],[])

    def test_uncertain_save_never_retries_even_if_activation_requested(self):
        self.importar_cartao(conectado=False)
        self.page.wait_for_function("document.querySelector('#status-conexao').textContent.includes('Entre na Centi')")
        self.page.evaluate('''()=>{
          window.loginConcluido=true;window.ativacoes=[];window.tentativasSalvar=0;
          chrome.tabs.update=async id=>{ativacoes.push(id);return {id}};
          const anterior=chrome.scripting.executeScript;
          chrome.scripting.executeScript=async p=>{
            if(p.func.name==='salvarLoteCenti'){
              window.tentativasSalvar++;
              return [{result:{ok:false,salvo:null,salvamentoAcionado:true,ativacaoNecessaria:true,mensagem:'Resultado incerto'}}];
            }
            return anterior(p);
          }
        }''')
        self.page.locator('#abrir-centi').click()
        self.page.wait_for_function("document.querySelector('#status').textContent.includes('Cadastro interrompido')")
        self.assertEqual(self.page.evaluate('ativacoes'),[])
        self.assertEqual(self.page.evaluate('tentativasSalvar'),1)
        with self.page.expect_download() as event:self.page.locator('#baixar-conexao').click()
        d=json.loads(Path(event.value.path()).read_text())
        self.assertEqual(d['falhaCadastro']['etapa'],'salvar')
        self.assertTrue(d['falhaCadastro']['salvamentoAcionado'])

    def test_download_map_reads_current_screen_and_includes_failed_stage(self):
        self.importar_cartao(conectado=False)
        self.page.wait_for_function("document.querySelector('#status-conexao').textContent.includes('Entre na Centi')")
        self.page.evaluate('''()=>{
          const anterior=chrome.scripting.executeScript;window.mapaAtual=1;
          chrome.scripting.executeScript=async p=>{
            if(p.func.name==='inspecionarConexaoCenti')return [{result:{tipo:'diagnostico_conexao_centi',versao:2,estado:'tela_disponivel',marcador:window.mapaAtual}}];
            if(p.func.name==='pesquisarEmpresaCenti')return [{result:{ok:false,etapa:'abrir_pesquisa',mensagem:'Cartão não identificado'}}];
            return anterior(p);
          }
        }''')
        self.page.locator('#abrir-centi').click()
        self.page.wait_for_function("document.querySelector('#status-localizacao').textContent.includes('Cartão não identificado')")
        self.page.evaluate('window.mapaAtual=2')
        with self.page.expect_download() as event:self.page.locator('#baixar-conexao').click()
        d=json.loads(Path(event.value.path()).read_text())
        self.assertEqual(d['marcador'],2)
        self.assertEqual(d['falhaLocalizacao']['funcao'],'pesquisarEmpresaCenti')
        self.assertEqual(d['falhaLocalizacao']['etapa'],'abrir_pesquisa')
        self.assertIn('lidoEm',d)

    def test_resume_existing_form_does_not_create_or_search_again(self):
        self.importar_cartao()
        self.page.evaluate('''() => {window.acoesRetomada=[];chrome.scripting.executeScript=async p=>{
          window.acoesRetomada.push(p.func.name);
          if(p.func.name==='pesquisarServicoCenti'){
            if(p.args[0].conferirManual!==true)throw Error('Não deve pesquisar');
            return [{result:{ok:true,selecionado:true,campos:{idVinculo:'0',nome:p.args[0].servico.nome,dataInicio:'20/10/2026',dataFim:''}}}];
          }
          if(p.func.name==='salvarServicoCenti'){
            window.revisado=p.args[0].revisado;
            return [{result:{ok:true,salvo:true,idVinculo:'200',mensagem:'ID definitivo observado'}}];
          }
          throw Error('Não deve navegar nem criar vínculo');
        }}''')
        self.page.locator('#opcoes-retomada summary').click()
        self.page.locator('#empresa-retomada').check()
        self.page.locator('#retomar-preenchido').click()
        self.page.locator('#salvamento').wait_for(state='visible')
        self.assertFalse(self.page.locator('#conferido').is_checked())
        self.page.locator('#revisao-salvamento').check()
        self.page.locator('#salvar-vinculo').click()
        self.page.wait_for_function("document.querySelector('#status-salvamento').textContent.includes('ID definitivo')")
        self.assertTrue(self.page.evaluate('window.revisado'))
        self.assertEqual(self.page.evaluate('window.acoesRetomada'),['pesquisarServicoCenti','salvarServicoCenti'])

if __name__=='__main__': unittest.main()
