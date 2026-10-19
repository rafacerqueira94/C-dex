"""Leitura DOM somente leitura: python tests/ler-vinculos-centi.py."""
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright


class LeituraVinculos(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        cls.browser = cls.p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        cls.source = (Path(__file__).resolve().parents[1] / 'ler-vinculos-centi.mjs').read_text().replace('export function', 'function', 1)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()

    def setUp(self):
        self.page = self.browser.new_page()
        self.page.route('**/*', lambda r: r.fulfill(status=200, content_type='text/html', body='<html></html>'))
        self.page.goto('https://ba.centi.com.br/caetite/')

    def tearDown(self):
        self.page.close()

    def grid(self, rows, header=None):
        header = header or '<div class="wj-cell"></div><div class="wj-cell">ID</div><div class="wj-cell">Serviço</div><div class="wj-cell">Data início</div><div class="wj-cell">Data fim</div>'
        return '<div class="wj-flexgrid"><div class="wj-colheaders">'+header+header+'</div><div class="wj-cells">'+rows+'</div></div>'

    def row(self, id='1000', name='SERVIÇO - 4%'):
        return f'<div class="wj-row"><div class="wj-cell"><input type="checkbox"></div><div class="wj-cell">{id}</div><div class="wj-cell">{name}</div><div class="wj-cell">18/11/2025</div><div class="wj-cell"></div></div>'

    def read(self):
        return self.page.evaluate('() => {'+self.source+'; return lerVinculosCenti();}')

    def test_seven_rendered_rows_can_represent_six_distinct_links(self):
        rows = ''.join(self.row(str(1000+i)) for i in range(6)) + self.row('1000')
        self.page.set_content(self.grid(rows))
        before = self.page.content()
        self.page.evaluate('window.acoes=0; document.addEventListener("click",()=>window.acoes++); document.addEventListener("input",()=>window.acoes++);')
        r = self.read()
        self.assertEqual(len(r['registros']), 6)
        self.assertEqual(r['repeticoesDeRenderizacao'], 1)
        self.assertFalse(r['leituraCompleta'])
        self.assertEqual(self.page.content(), before)
        self.assertEqual(self.page.evaluate('window.acoes'), 0)

    def test_distinct_binding_ids_are_never_merged_by_service_name(self):
        self.page.set_content(self.grid(self.row('1000')+self.row('1001')))
        self.assertEqual(len(self.read()['registros']), 2)

    def test_conflicting_copies_of_same_id_abort(self):
        self.page.set_content(self.grid(self.row()+self.row(name='OUTRO - 4%')))
        with self.assertRaisesRegex(Exception, 'dados divergentes'):
            self.read()

    def test_unknown_extra_row_is_reported_and_does_not_imply_complete_read(self):
        self.page.set_content(self.grid(self.row()+self.row(id='0')))
        r = self.read()
        self.assertEqual(len(r['registros']), 1)
        self.assertEqual(r['linhasNaoInterpretadas'], 1)
        self.assertEqual(r['detalhesLinhasNaoInterpretadas'][0]['motivo'], 'identificacao_invalida')
        self.assertFalse(r['leituraCompleta'])

    def test_rejects_lookup_form_or_incorrect_headers(self):
        for extra in ['<input id="IdServicoABC">', '<div class="tableFilterSearch--modal">Lupa</div>', '<input type="password">']:
            self.page.set_content(self.grid(self.row())+extra)
            with self.assertRaises(Exception): self.read()
        self.page.set_content(self.grid(self.row(), header='<div class="wj-cell">Código</div>'))
        with self.assertRaises(Exception): self.read()

    def test_rejects_wrong_origin(self):
        self.page.goto('https://exemplo.com/caetite/')
        self.page.set_content(self.grid(self.row()))
        with self.assertRaisesRegex(Exception, 'Caetité'): self.read()

    def test_repeated_header_in_data_panel_is_reported_separately(self):
        header = '<div class="wj-row">'+''.join('<div class="wj-cell">'+text+'</div>' for text in ['', 'ID', 'Serviço', 'Data início', 'Data fim'])+'</div>'
        self.page.set_content(self.grid(header+self.row()))
        r = self.read()
        self.assertEqual(len(r['registros']), 1)
        self.assertEqual(r['cabecalhosRepetidosIgnorados'], 1)
        self.assertEqual(r['linhasNaoInterpretadas'], 0)
        self.assertFalse(r['leituraCompleta'])

    def test_partial_header_match_is_still_uninterpreted(self):
        self.page.set_content(self.grid(self.row(id='ID', name='Serviço')))
        r = self.read()
        self.assertEqual(r['cabecalhosRepetidosIgnorados'], 0)
        self.assertEqual(r['linhasNaoInterpretadas'], 1)


if __name__ == '__main__': unittest.main()
