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


if __name__ == '__main__': unittest.main()
