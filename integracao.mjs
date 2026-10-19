import {lerVinculosCenti} from './ler-vinculos-centi.mjs';
import {compararCaptura} from './comparar-captura.mjs';
import {pesquisarServicoCenti} from './pesquisar-servico-centi.mjs';

const $ = id => document.getElementById(id);
const aba = Number(new URLSearchParams(location.search).get('aba'));
let resultado = null;
let sequencia = 0;
const botoesPesquisa = ['pesquisar-catalogo', 'pesquisar-selecionar'];
const habilitarPesquisa = () => botoesPesquisa.forEach(id => {
  $(id).disabled = !$('ausencia-conferida').checked || !$('servico-pesquisa').options.length;
});
const habilitarConferenciaManual = () => { $('conferir-manual').disabled = !resultado || !$('servico-pesquisa').options.length; };
const limpar = () => {
  sequencia++; resultado = null; $('resultado').hidden = true; $('pesquisa').hidden = true;
  $('ausencia-conferida').checked = false; habilitarPesquisa(); habilitarConferenciaManual();
  $('status-pesquisa').textContent = ''; $('erro').hidden = true; $('status').textContent = '';
};
for (const id of ['lista', 'cnpj', 'conferido']) $(id).addEventListener('change', limpar);
$('cnpj').addEventListener('input', limpar);
$('form-comparar').addEventListener('submit', async e => {
  e.preventDefault(); limpar(); $('comparar').disabled = true;
  const atual = sequencia;
  try {
    if (!Number.isSafeInteger(aba) || aba <= 0) throw Error('Na aba da Centi, clique no ícone do Ponte Centi para abrir esta comparação.');
    if (!$('conferido').checked) throw Error('Confira a empresa antes de ler os vínculos.');
    const arquivo = $('lista').files[0];
    if (!arquivo || arquivo.size > 2 * 1024 * 1024) throw Error('Selecione uma lista JSON de até 2 MB.');
    const texto = (await arquivo.text()).replace(/^\uFEFF/, '');
    if (/\.pdf$/i.test(arquivo.name) || texto.trimStart().startsWith('%PDF-')) {
      throw Error('Você selecionou um cartão PDF. Use “Gerar lista conferida a partir do PDF”, confira os serviços e baixe a lista. Depois importe aqui o arquivo servicos-conferidos-….json.');
    }
    let plano;
    try { plano = JSON.parse(texto); }
    catch { throw Error('Não foi possível ler a lista. Selecione o arquivo servicos-conferidos-….json baixado pelo Ponte Centi após confirmar os serviços.'); }
    if (plano?.tipo !== 'lista_servicos_conferida') {
      throw Error('Este arquivo não é uma lista conferida de serviços. Use “Gerar lista conferida a partir do PDF” e baixe o arquivo após confirmar os serviços.');
    }
    const cnpj = $('cnpj').value;
    const resposta = await fetch('data/servicos-centi-extraido.json');
    if (!resposta.ok) throw Error('Não foi possível carregar o catálogo.');
    const catalogo = await resposta.json();
    // Validar lista e confirmação antes de acessar a página.
    compararCaptura(plano, {tipo: 'captura_vinculos_centi', registros: []}, catalogo, cnpj);
    $('status').textContent = 'Lendo os vínculos visíveis da aba da Centi…';
    const leituras = await chrome.scripting.executeScript({target: {tabId: aba}, func: lerVinculosCenti});
    const captura = leituras[0]?.result;
    if (captura?.tipo === 'erro_leitura_centi') throw Error(captura.mensagem || 'Não foi possível ler a relação de Serviços.');
    if (!captura) throw Error('A aba da Centi não retornou a leitura. Clique novamente no ícone na aba da Centi.');
    const comparacao = compararCaptura(plano, captura, catalogo, cnpj);
    if (atual !== sequencia) throw Error('Os dados foram alterados durante a leitura. Confira a empresa e compare novamente.');
    resultado = {...comparacao, captura};
    $('resumo').textContent = `${comparacao.totalVinculosVisiveis} vínculo(s) com ID e ${comparacao.totalVinculosPendentes} novo(s) pendente(s) visíveis. Esta comparação é parcial e não autoriza inclusão automática.`;
    const rotulos = {localizado: 'Localizado na captura — confira a vigência', preenchido_sem_salvar: 'Já preenchido em vínculo pendente — não incluir novamente', conflito: 'Conflito — revisar', nao_localizado_na_captura: 'Não localizado nesta captura — ainda não incluir'};
    $('servicos-comparados').replaceChildren(...comparacao.servicos.map(s => {
      const li = document.createElement('li'); li.textContent = `${s.codigo} · ${s.aliquota}% · ${rotulos[s.situacao]}`; return li;
    }));
    const pendencias = comparacao.vinculosSemIdentificacao.map(v => `Vínculo ${v.idVinculo}: ${v.nome} — ${v.identificacao === 'ambigua' ? 'mais de um registro no catálogo' : 'sem correspondência no catálogo atual'}`);
    $('nao-identificados').replaceChildren(...(pendencias.length ? pendencias : ['Nenhum vínculo sem identificação nesta captura.']).map(texto => {
      const li = document.createElement('li'); li.textContent = texto; return li;
    }));
    $('aviso').textContent = comparacao.observacao + (captura.linhasNaoInterpretadas ? ` ${captura.linhasNaoInterpretadas} linha(s) não puderam ser interpretadas.` : '');
    $('resultado').hidden = false; $('status').textContent = 'Comparação concluída. Nenhum dado foi alterado na Centi.';
    const candidatosPesquisa = comparacao.servicos.filter(s => s.situacao === 'nao_localizado_na_captura');
    $('servico-pesquisa').replaceChildren(...candidatosPesquisa.map(s => {
      const option = document.createElement('option'); option.value = s.codigo;
      option.textContent = `${s.codigo} · ${s.aliquota}% · ${s.nome}`; return option;
    }));
    $('pesquisa').hidden = !candidatosPesquisa.length;
    habilitarConferenciaManual();
  } catch (erro) {
    $('erro').textContent = erro.message; $('erro').hidden = false; $('status').textContent = '';
  } finally { $('comparar').disabled = false; }
});
$('ausencia-conferida').addEventListener('change', habilitarPesquisa);
$('servico-pesquisa').addEventListener('change', () => {
  $('ausencia-conferida').checked = false; habilitarPesquisa(); $('status-pesquisa').textContent = '';
});
async function executarPesquisa(selecionar, conferirManual = false) {
  if (!resultado || (!conferirManual && !$('ausencia-conferida').checked)) return;
  const servico = resultado.servicos.find(s => s.codigo === $('servico-pesquisa').value && s.situacao === 'nao_localizado_na_captura');
  if (!servico) return;
  const pedido = {servico, cnpjEsperado: resultado.empresa.cnpj, cnpjConfirmado: $('cnpj').value,
    conferido: $('conferido').checked, ausenciaConferida: !conferirManual, selecionar, conferirManual,
    datasEsperadas: resultado.ultimaPesquisa?.codigo === servico.codigo ? resultado.ultimaPesquisa.detalhesSelecao?.datasAntes : null};
  const controles = [...document.querySelectorAll('#form-comparar input, #form-comparar button, #servico-pesquisa, #ausencia-conferida, #pesquisar-catalogo, #pesquisar-selecionar, #conferir-manual')];
  const anteriores = controles.map(e => e.disabled);
  controles.forEach(e => { e.disabled = true; });
  resultado.ultimaPesquisa = {codigo: servico.codigo, idMunicipal: servico.id, ok: false, salvo: false,
    selecionado: null, etapa: 'execucao_em_andamento', selecaoSolicitada: selecionar};
  $('status-pesquisa').textContent = conferirManual ? 'Conferindo o serviço escolhido manualmente…' : selecionar ? 'Pesquisando e selecionando o serviço na Centi, sem salvar…' : 'Abrindo a lupa e pesquisando o serviço na Centi…';
  try {
    const respostas = await chrome.scripting.executeScript({target: {tabId: aba}, world: selecionar && !conferirManual ? 'MAIN' : 'ISOLATED', func: pesquisarServicoCenti, args: [pedido]});
    const preparacao = respostas[0]?.result;
    if (!preparacao || typeof preparacao.ok !== 'boolean') throw Error('Não foi possível obter o resultado da pesquisa. Verifique a aba Centi.');
    resultado.ultimaPesquisa = {codigo: servico.codigo, idMunicipal: servico.id, ...preparacao};
    $('status-pesquisa').textContent = preparacao.mensagem;
    if (preparacao.ok && preparacao.selecionado) {
      [...$('servico-pesquisa').options].filter(o => o.value === servico.codigo).forEach(o => o.remove());
    }
  } catch (e) {
    const mensagem = `${e.message} Verifique a aba Centi antes de tentar novamente; a lupa, os filtros ou o Serviço podem ter mudado.`;
    resultado.ultimaPesquisa = {codigo: servico.codigo, idMunicipal: servico.id, ok: false, salvo: false,
      selecionado: null, etapa: 'erro_de_execucao', resultadoNaoConfirmado: true, mensagem};
    $('status-pesquisa').textContent = mensagem;
  }
  finally {
    controles.forEach((e, i) => { e.disabled = anteriores[i]; });
    $('ausencia-conferida').checked = false; habilitarPesquisa(); habilitarConferenciaManual();
  }
}
$('pesquisar-catalogo').addEventListener('click', () => executarPesquisa(false));
$('pesquisar-selecionar').addEventListener('click', () => executarPesquisa(true));
$('conferir-manual').addEventListener('click', () => executarPesquisa(false, true));
$('exportar-comparacao').addEventListener('click', () => {
  if (!resultado) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(resultado, null, 2)], {type: 'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = `comparacao-centi-${Date.now()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
