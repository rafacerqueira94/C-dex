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

    def api_virtualizada(self, dados, colunas=None):
        self.page.set_content(self.grid('', header='<div class="wj-cell"></div><div class="wj-cell">ID</div><div class="wj-cell">Serviço</div>'))
        self.page.evaluate("""p=>{
          window.acoes=0;
          const controle={columns:p.colunas.map(header=>({header})),rows:p.dados.map(()=>({})),
            getCellData:(i,c)=>p.dados[i][c],select:()=>{window.acoes++;throw Error('Não selecionar durante leitura')}};
          window.wijmo={Control:{getControl:()=>controle}};
        }""", {'dados':dados,'colunas':colunas or ['ID','Serviço','Data início','Data fim']})
    def test_virtualized_dates_are_read_by_public_api_without_clicks(self):
        self.api_virtualizada([['1000','238','20/10/2026',''],['0','51','20/10/2026','']])
        r=self.read();self.assertEqual(r['origemLeitura'],'api_publica_wijmo')
        self.assertEqual(r['registros'][0]['dataInicio'],'20/10/2026')
        self.assertEqual(r['vinculosPendentes'][0]['nome'],'51')
        self.assertFalse(r['leituraCompleta']);self.assertEqual(self.page.evaluate('acoes'),0)
    def test_public_api_missing_date_column_is_not_accepted(self):
        self.api_virtualizada([['1000','238']],['ID','Serviço'])
        self.assertEqual(self.read()['tipo'],'erro_leitura_centi')
    def test_conflicting_rows_from_api_still_abort(self):
        self.api_virtualizada([['1000','238','20/10/2026',''],['1000','51','20/10/2026','']])
        self.assertIn('dados divergentes',self.read()['mensagem'])
    def empty_collection(self):
        self.page.set_content('<div class="divTreeSelected"><span>Serviços</span></div><div class="wj-flexgrid wj-state-empty tableSearch gridCollectionTotal"><div class="wj-cells"><div class="wj-row"></div></div></div>')
        self.page.evaluate("""()=>{
          window.view={items:[],sourceCollection:[],isLoading:false,totalItemCount:0};
          const controle={columns:[],rows:[],collectionView:view,getCellData(){throw Error('Nenhuma célula para ler')}};
          window.wijmo={Control:{getControl:()=>controle}};
        }""")
    def test_empty_collection_without_schema_requires_stable_source_and_services_context(self):
        self.empty_collection();self.assertEqual(self.read()['tipo'],'erro_leitura_centi')
        self.page.wait_for_timeout(750)
        r=self.read();self.assertEqual(r['origemLeitura'],'api_publica_lista_vazia');self.assertEqual(r['registros'],[])
        self.assertEqual(r['linhasNaoInterpretadas'],0);self.assertFalse(r['leituraCompleta'])
    def test_zero_rows_do_not_prove_empty_when_loading_filtered_or_source_missing(self):
        for alterar in ["view.isLoading=true","view.sourceCollection.push({id:1})","view.totalItemCount=10","view.sourceCollection=null"]:
            self.empty_collection();self.page.evaluate(alterar)
            self.assertEqual(self.read()['tipo'],'erro_leitura_centi')
    def test_distinct_binding_ids_are_never_merged_by_service_name(self):
        self.page.set_content(self.grid(self.row('1000')+self.row('1001')))
        self.assertEqual(len(self.read()['registros']), 2)

    def test_conflicting_copies_of_same_id_abort(self):
        self.page.set_content(self.grid(self.row()+self.row(name='OUTRO - 4%')))
        r = self.read()
        self.assertEqual(r['tipo'], 'erro_leitura_centi')
        self.assertIn('dados divergentes', r['mensagem'])

    def test_unknown_extra_row_is_reported_and_does_not_imply_complete_read(self):
        self.page.set_content(self.grid(self.row()+self.row(id='desconhecido')))
        r = self.read()
        self.assertEqual(len(r['registros']), 1)
        self.assertEqual(r['linhasNaoInterpretadas'], 1)
        self.assertEqual(r['detalhesLinhasNaoInterpretadas'][0]['motivo'], 'identificacao_invalida')
        self.assertFalse(r['leituraCompleta'])

    def test_rejects_lookup_form_or_incorrect_headers(self):
        for extra in ['<input id="IdServicoABC">', '<div class="tableFilterSearch--modal">Lupa</div>', '<input type="password">']:
            self.page.set_content(self.grid(self.row())+extra)
            self.assertEqual(self.read()['tipo'], 'erro_leitura_centi')
        self.page.set_content(self.grid(self.row(), header='<div class="wj-cell">Código</div>'))
        self.assertEqual(self.read()['tipo'], 'erro_leitura_centi')

    def test_rejects_wrong_origin(self):
        self.page.goto('https://exemplo.com/caetite/')
        self.page.set_content(self.grid(self.row()))
        r = self.read()
        self.assertEqual(r['tipo'], 'erro_leitura_centi')
        self.assertIn('Caetité', r['mensagem'])

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

    def test_unsaved_link_zero_is_captured_separately_without_merging(self):
        self.page.set_content(self.grid(self.row('1000')+self.row('0')+self.row('0')))
        r = self.read()
        self.assertEqual(len(r['registros']), 1)
        self.assertEqual(len(r['vinculosPendentes']), 2)
        self.assertEqual(r['vinculosPendentes'][0]['idVinculo'], '0')
        self.assertEqual(r['linhasNaoInterpretadas'], 0)
        self.assertFalse(r['leituraCompleta'])


if __name__ == '__main__': unittest.main()
