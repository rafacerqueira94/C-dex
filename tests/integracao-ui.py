"""Interface em navegador com API Chrome simulada: python tests/integracao-ui.py."""
import json
import mimetypes
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class IntegracaoUI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        cls.servico = json.loads((ROOT / 'data/servicos-centi-extraido.json').read_text())[0]

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()

    def setUp(self):
        self.ctx = self.browser.new_context(accept_downloads=True)
        self.page = self.ctx.new_page()
        def route(r):
            from urllib.parse import urlsplit, unquote
            path = (ROOT / unquote(urlsplit(r.request.url).path).lstrip('/')).resolve()
            if not path.is_relative_to(ROOT) or not path.is_file():
                r.fulfill(status=404, body='Not found')
            else:
                mime = 'text/javascript' if path.suffix == '.mjs' else mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
                r.fulfill(status=200, content_type=mime, body=path.read_bytes())
        self.ctx.route('http://ponte.test/**', route)
        capture = {'tipo': 'captura_vinculos_centi', 'registros': [
            {'idVinculo': '9999', 'nome': self.servico['Nome'], 'dataInicio': '18/11/2025', 'dataFim': ''},
            {'idVinculo': '10000', 'nome': '<img src=x onerror="window.injetado=true"> - 4%', 'dataInicio': '', 'dataFim': ''}
        ], 'linhasNaoInterpretadas': 1, 'leituraCompleta': False}
        self.page.add_init_script('window.leituras=0;window.chrome={scripting:{executeScript:async()=>{window.leituras++;return [{result:'+json.dumps(capture)+'}];}}};')
        self.page.goto('http://ponte.test/integracao.html?aba=123')
        s = self.servico
        plan = {'tipo': 'lista_servicos_conferida', 'conferidoPeloOperador': True, 'empresa': {'cnpj': '11222333000181'},
                'servicos': [{'id': s['Id'], 'codigo': s['CodigoCompleto'], 'aliquota': s['Aliquota']}]}
        self.page.locator('#lista').set_input_files({'name': 'lista.json', 'mimeType': 'application/json', 'buffer': json.dumps(plan).encode()})
        self.page.locator('#cnpj').fill('11.222.333/0001-81')
        self.page.locator('#conferido').check()

    def tearDown(self):
        self.ctx.close()

    def test_import_compare_export_and_invalidate_after_company_change(self):
        self.page.locator('#comparar').click()
        self.page.locator('#resultado').wait_for(state='visible')
        self.assertIn('Localizado na captura', self.page.locator('#servicos-comparados').inner_text())
        self.assertIn('sem correspondência', self.page.locator('#nao-identificados').inner_text())
        self.assertEqual(self.page.locator('#nao-identificados img').count(), 0)
        self.assertFalse(self.page.evaluate('Boolean(window.injetado)'))
        with self.page.expect_download() as event:
            self.page.locator('#exportar-comparacao').click()
        result = json.loads(Path(event.value.path()).read_text())
        self.assertFalse(result['podePreencher'])
        self.assertFalse(result['salvo'])
        self.assertEqual(result['totalVinculosVisiveis'], 2)
        self.assertTrue(self.page.locator('#pesquisa').is_hidden())
        self.page.locator('#cnpj').fill('00000000000000')
        self.assertTrue(self.page.locator('#resultado').is_hidden())

    def test_wrong_company_prevents_access_to_centi(self):
        self.page.locator('#cnpj').fill('00000000000000')
        self.page.locator('#comparar').click()
        self.page.locator('#erro').wait_for(state='visible')
        self.assertEqual(self.page.evaluate('window.leituras'), 0)
        self.assertTrue(self.page.locator('#resultado').is_hidden())

    def test_permission_failure_is_shown_without_results(self):
        self.page.evaluate('() => { chrome.scripting.executeScript=async()=>{throw Error("Permissão da aba expirada; clique no ícone novamente.")}; }')
        self.page.locator('#comparar').click()
        self.page.locator('#erro').wait_for(state='visible')
        self.assertIn('Permissão', self.page.locator('#erro').inner_text())
        self.assertTrue(self.page.locator('#resultado').is_hidden())

    def test_pdf_rejection_explains_how_to_generate_list_without_reading_centi(self):
        for name in ['download.pdf', 'arquivo.json']:
            self.page.locator('#lista').set_input_files({'name': name, 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4\nsecret document content'})
            self.page.locator('#comparar').click()
            self.page.locator('#erro').wait_for(state='visible')
            self.assertIn('Gerar lista conferida a partir do PDF', self.page.locator('#erro').inner_text())
            self.assertNotIn('secret document content', self.page.locator('#erro').inner_text())
            self.assertEqual(self.page.evaluate('window.leituras'), 0)

    def test_invalid_json_and_diagnostic_have_clear_errors(self):
        for content in [b'{ private text invalid', b'{"tipo":"diagnostico_estrutura_centi"}']:
            self.page.locator('#lista').set_input_files({'name': 'arquivo.json', 'mimeType': 'application/json', 'buffer': content})
            self.page.locator('#comparar').click()
            self.page.locator('#erro').wait_for(state='visible')
            self.assertIn('servi', self.page.locator('#erro').inner_text())
            self.assertNotIn('private text', self.page.locator('#erro').inner_text())
            self.assertEqual(self.page.evaluate('window.leituras'), 0)

    def test_generate_list_link_preserves_comparison_tab(self):
        with self.page.expect_popup() as popup:
            self.page.locator('#gerar-lista').click()
        new_page = popup.value
        new_page.wait_for_load_state()
        self.assertTrue(new_page.url.endswith('/consulta.html'))
        self.assertIn('integracao.html?aba=123', self.page.url)
        self.assertEqual(new_page.locator('#arquivo-pdf').count(), 1)

    def test_search_requires_confirmation_and_exports_its_result(self):
        self.page.evaluate('''() => { chrome.scripting.executeScript=async p=>{
          if(p.func.name==='lerVinculosCenti')return [{result:{tipo:'captura_vinculos_centi',registros:[],linhasNaoInterpretadas:0}}];
          window.ultimoPedido=p.args[0];
          return [{result:{ok:true,salvo:false,selecionado:false,etapa:'pesquisa_conferida',mensagem:'Pesquisa atualizada. Nenhum serviço foi selecionado.'}}];
        }; }''')
        self.page.locator('#comparar').click()
        self.page.locator('#pesquisa').wait_for(state='visible')
        self.assertTrue(self.page.locator('#pesquisar-catalogo').is_disabled())
        self.assertEqual(self.page.locator('#servico-pesquisa option').count(), 1)
        self.page.locator('#ausencia-conferida').check()
        self.page.locator('#pesquisar-catalogo').click()
        self.page.wait_for_function('document.querySelector("#status-pesquisa").textContent.includes("Pesquisa atualizada")')
        pedido = self.page.evaluate('window.ultimoPedido')
        self.assertTrue(pedido['ausenciaConferida'])
        self.assertEqual(str(pedido['servico']['id']), str(self.servico['Id']))
        self.assertTrue(self.page.locator('#pesquisar-catalogo').is_disabled())
        with self.page.expect_download() as event:
            self.page.locator('#exportar-comparacao').click()
        r = json.loads(Path(event.value.path()).read_text())
        self.assertEqual(r['ultimaPesquisa']['etapa'], 'pesquisa_conferida')
        self.assertFalse(r['ultimaPesquisa']['selecionado'])
        self.assertFalse(r['podePreencher'])

    def test_selection_request_exports_verified_result_and_removes_service_from_options(self):
        self.page.evaluate('''() => { chrome.scripting.executeScript=async p=>{
          if(p.func.name==='lerVinculosCenti')return [{result:{tipo:'captura_vinculos_centi',registros:[],linhasNaoInterpretadas:0}}];
          window.ultimoPedido=p.args[0];window.ultimoMundo=p.world;
          return [{result:{ok:true,salvo:false,selecionado:true,etapa:'servico_conferido',mensagem:'Serviço selecionado sem salvar.'}}];
        }; }''')
        self.page.locator('#comparar').click()
        self.page.locator('#pesquisa').wait_for(state='visible')
        self.assertTrue(self.page.locator('#pesquisar-selecionar').is_disabled())
        self.page.locator('#ausencia-conferida').check()
        self.page.locator('#pesquisar-selecionar').click()
        self.page.wait_for_function('document.querySelector("#status-pesquisa").textContent.includes("Serviço selecionado")')
        self.assertTrue(self.page.evaluate('window.ultimoPedido.selecionar'))
        self.assertEqual(self.page.evaluate('window.ultimoMundo'), 'MAIN')
        self.assertEqual(self.page.locator('#servico-pesquisa option').count(), 0)
        self.assertTrue(self.page.locator('#pesquisar-selecionar').is_disabled())
        with self.page.expect_download() as event:
            self.page.locator('#exportar-comparacao').click()
        r = json.loads(Path(event.value.path()).read_text())
        self.assertTrue(r['ultimaPesquisa']['selecionado'])
        self.assertFalse(r['salvo'])

    def test_failed_retry_does_not_export_a_previous_success(self):
        self.page.evaluate('''() => { window.tentativas=0; chrome.scripting.executeScript=async p=>{
          if(p.func.name==='lerVinculosCenti')return [{result:{tipo:'captura_vinculos_centi',registros:[],linhasNaoInterpretadas:0}}];
          if(window.tentativas++)throw Error('Falha de execução');
          return [{result:{ok:true,salvo:false,selecionado:false,etapa:'pesquisa_conferida',mensagem:'Pesquisa atualizada.'}}];
        }; }''')
        self.page.locator('#comparar').click()
        self.page.locator('#pesquisa').wait_for(state='visible')
        self.page.locator('#ausencia-conferida').check()
        self.page.locator('#pesquisar-catalogo').click()
        self.page.wait_for_function('document.querySelector("#status-pesquisa").textContent.includes("Pesquisa atualizada")')
        self.page.locator('#ausencia-conferida').check()
        self.page.locator('#pesquisar-catalogo').click()
        self.page.wait_for_function('document.querySelector("#status-pesquisa").textContent.includes("Falha de execução")')
        with self.page.expect_download() as event:
            self.page.locator('#exportar-comparacao').click()
        r = json.loads(Path(event.value.path()).read_text())
        self.assertFalse(r['ultimaPesquisa']['ok'])
        self.assertEqual(r['ultimaPesquisa']['etapa'], 'erro_de_execucao')
        self.assertIsNone(r['ultimaPesquisa']['selecionado'])

    def test_manual_check_does_not_require_empty_service_confirmation(self):
        self.page.evaluate('''() => { chrome.scripting.executeScript=async p=>{
          if(p.func.name==='lerVinculosCenti')return [{result:{tipo:'captura_vinculos_centi',registros:[],linhasNaoInterpretadas:0}}];
          window.pedidoManual=p.args[0];window.mundoManual=p.world;
          return [{result:{ok:true,salvo:false,selecionado:true,origemSelecao:'operador',etapa:'servico_conferido',mensagem:'Seleção manual conferida.'}}];
        }; }''')
        self.page.locator('#comparar').click()
        self.page.locator('#pesquisa').wait_for(state='visible')
        self.assertFalse(self.page.locator('#ausencia-conferida').is_checked())
        self.page.locator('#conferir-manual').click()
        self.page.wait_for_function('document.querySelector("#status-pesquisa").textContent.includes("Seleção manual conferida")')
        self.assertTrue(self.page.evaluate('pedidoManual.conferirManual'))
        self.assertFalse(self.page.evaluate('pedidoManual.ausenciaConferida'))
        self.assertEqual(self.page.evaluate('mundoManual'), 'ISOLATED')


if __name__ == '__main__': unittest.main()
