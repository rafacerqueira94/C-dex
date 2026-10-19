"""Validação DOM com Playwright: python tests/diagnostico-centi.py."""
import json
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright


class DiagnosticoCenti(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        source = (Path(__file__).resolve().parents[1] / 'tools/diagnostico-centi/inspecionar.mjs').read_text()
        cls.source = source.replace('export function inspecionarTelaCenti', 'function inspecionarTelaCenti')

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.page.route('**/*', lambda route: route.fulfill(status=200, content_type='text/html', body='<html><body></body></html>'))
        self.page.goto('https://ba.centi.com.br/caetite/cadastro')

    def tearDown(self):
        self.page.close()

    def report(self):
        return self.page.evaluate('() => {' + self.source + '; return inspecionarTelaCenti();}')

    def test_reads_structure_without_private_data_or_mutation(self):
        self.page.set_content('''<input id="IdServico-secreto" value="219">
        <input id="IdServico-secreto-second" value="NOME PRIVADO">
        <input id="Id-secreto" value="0" readonly>
        <input id="Cnpj" value="11222333000181">
        <table><thead><tr><th>Código</th><th>Alíquota</th><th>NOME PRIVADO</th></tr></thead>
        <tbody><tr><td>07.07.000</td><td>4,00</td><td>NOME PRIVADO</td></tr></tbody></table>
        <button>Salvar</button><button>NOME PRIVADO</button>
        <script>window.acoes=0;document.addEventListener('click',()=>window.acoes++);
        document.addEventListener('input',()=>window.acoes++);document.addEventListener('change',()=>window.acoes++);</script>''')
        before = self.page.content()
        r = self.report()
        self.assertEqual(r['grades'][0]['cabecalhos'], ['Código', 'Alíquota', 'não reconhecido'])
        self.assertEqual(r['grades'][0]['linhasVisiveis'], 1)
        self.assertEqual(r['grades'][0]['celulasPorLinha'], [3])
        self.assertEqual(len(r['campos']), 3)
        self.assertTrue(r['campos'][1]['secundario'])
        self.assertFalse(r['salvo'])
        for private in ['NOME PRIVADO', '11222333000181', '07.07.000', '4,00', 'secreto']:
            self.assertNotIn(private, json.dumps(r))
        self.assertEqual(self.page.content(), before)
        self.assertEqual(self.page.evaluate('window.acoes'), 0)

    def test_rejects_other_origin_or_municipality(self):
        for url in ['https://exemplo.com/caetite/', 'https://ba.centi.com.br/outro/']:
            self.page.goto(url)
            with self.assertRaisesRegex(Exception, 'Abra a Centi de Caetité'):
                self.report()

    def test_rejects_visible_login(self):
        self.page.set_content('<input type="password">')
        with self.assertRaisesRegex(Exception, 'Entre na Centi'):
            self.report()

    def test_hidden_elements_are_not_reported(self):
        self.page.set_content('<div style="display:none"><input type="password"><table><tr><th>Nome</th></tr></table><button>Salvar</button></div>')
        r = self.report()
        self.assertEqual(r['grades'], [])
        self.assertEqual(r['botoes'], [])

    def test_wijmo_modal_is_not_confused_with_registered_list(self):
        self.page.set_content('''<div class="wj-flexgrid tableFilterSearch--modal" role="grid">
        <div role="columnheader">ID</div><div class="wj-cells"><div role="row"><div role="gridcell">219</div></div></div></div>
        <div class="wj-flexgrid"><div role="columnheader">Serviço</div></div>
        <div class="rowFilter">Filtro</div><span class="iconSearchReference">Lupa</span>''')
        r = self.report()
        self.assertEqual([g['tipo'] for g in r['grades']], ['lupa', 'lista'])
        self.assertEqual(r['lupasVisiveis'], 1)
        self.assertEqual(r['filtrosVisiveis'], 1)

    def test_wijmo_without_aria_roles(self):
        self.page.set_content('''<div class="wj-flexgrid">
        <div class="wj-colheaders"><div class="wj-row"><div class="wj-cell">Código</div><div class="wj-cell">Alíquota</div></div></div>
        <div class="wj-cells"><div class="wj-row"><div class="wj-cell">07.07.000</div><div class="wj-cell">4,00</div></div></div>
        </div>''')
        r = self.report()
        self.assertEqual(r['versao'], 2)
        grade = r['grades'][0]
        self.assertEqual(grade['cabecalhos'], ['Código', 'Alíquota'])
        self.assertEqual(grade['linhasVisiveis'], 1)
        self.assertEqual(grade['celulasPorLinha'], [2])
        self.assertEqual(grade['estruturaWijmo']['celulasNoDom'], 2)
        self.assertNotIn('07.07.000', json.dumps(r))
        self.assertNotIn('4,00', json.dumps(r))

    def test_wijmo_with_both_roles_and_classes_is_counted_once(self):
        self.page.set_content('''<div class="wj-flexgrid" role="grid">
        <div class="wj-colheaders"><div class="wj-row" role="row"><div class="wj-cell" role="columnheader">Código</div></div></div>
        <div class="wj-cells"><div class="wj-row" role="row"><div class="wj-cell" role="gridcell">07.07.000</div></div></div></div>''')
        grade = self.report()['grades'][0]
        self.assertEqual(grade['cabecalhos'], ['Código'])
        self.assertEqual(grade['linhasVisiveis'], 1)
        self.assertEqual(grade['celulasPorLinha'], [1])


if __name__ == '__main__':
    unittest.main()
