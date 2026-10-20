import {pesquisarEmpresaCenti} from './pesquisar-empresa-centi.mjs';
import {abrirEmpresaCenti} from './abrir-empresa-centi.mjs';
import {conectarCenti, inspecionarConexaoCenti} from './conectar-centi.mjs';
import {cadastrarServicos} from './cadastrar-servicos.mjs';
import {navegarServicosCenti} from './navegar-servicos-centi.mjs';
import {receberPlanoDaAba} from './fluxo-pdf.mjs';
import {salvarServicoCenti} from './salvar-servico-centi.mjs';
import {lerVinculosCenti} from './ler-vinculos-centi.mjs';
import {compararCaptura} from './comparar-captura.mjs';
import {pesquisarServicoCenti} from './pesquisar-servico-centi.mjs';

const $ = id => document.getElementById(id);
let aba = new URLSearchParams(location.search).has('aba') ? Number(new URLSearchParams(location.search).get('aba')) : null;
let diagnosticoConexao = null;
let verificandoConexao = false;
let localizandoEmpresa = false;
let empresaLocalizada = false;
let falhaLocalizacao = null;
let resultado = null;
let planoDoPdf = null;
let planoAtual = null;
let catalogoAtual = null;
let cadastrando = false;
let selecaoParaSalvar = null;
let salvando = false;
let sequencia = 0;
const botoesPesquisa = ['pesquisar-catalogo', 'pesquisar-selecionar'];
const habilitarPesquisa = () => botoesPesquisa.forEach(id => {
  $(id).disabled = !$('ausencia-conferida').checked || !$('servico-pesquisa').options.length;
});
const habilitarConferenciaManual = () => { $('conferir-manual').disabled = !resultado || !$('servico-pesquisa').options.length; };
const limpar = () => {
  sequencia++; resultado = null; selecaoParaSalvar = null; $('salvamento').hidden = true; $('revisao-salvamento').checked = false; $('salvar-vinculo').disabled = true; $('resultado').hidden = true; $('pesquisa').hidden = true;
  $('ausencia-conferida').checked = false; habilitarPesquisa(); habilitarConferenciaManual();
  $('automatico').hidden = true; $('autorizar-cadastro').disabled = false; $('autorizar-cadastro').checked = false; $('cadastrar-servicos').disabled = true;
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
    let plano = planoDoPdf;
    if (!plano) {
      if (!arquivo || arquivo.size > 2 * 1024 * 1024) throw Error('Selecione uma lista JSON de até 2 MB.');
      const texto = (await arquivo.text()).replace(/^\uFEFF/, '');
      if (/\.pdf$/i.test(arquivo.name) || texto.trimStart().startsWith('%PDF-')) {
        throw Error('Você selecionou um cartão PDF. Use “Gerar lista conferida a partir do PDF”, confira os serviços e baixe a lista. Depois importe aqui o arquivo servicos-conferidos-….json.');
      }
      try { plano = JSON.parse(texto); }
      catch { throw Error('Não foi possível ler a lista. Selecione o arquivo servicos-conferidos-….json baixado pelo Ponte Centi após confirmar os serviços.'); }
      if (plano?.tipo !== 'lista_servicos_conferida') {
        throw Error('Este arquivo não é uma lista conferida de serviços. Use “Gerar lista conferida a partir do PDF” e baixe o arquivo após confirmar os serviços.');
      }
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
    planoAtual = plano; catalogoAtual = catalogo;
    apresentarComparacao(comparacao, captura);
    if (empresaLocalizada && planoDoPdf?.autorizarCadastroAutomatico === true && !$('automatico').hidden) {
      $('autorizar-cadastro').checked = true;
      $('cadastrar-servicos').disabled = false;
      setTimeout(() => $('cadastrar-servicos').click(), 0);
    }
  } catch (erro) {
    $('erro').textContent = erro.message; $('erro').hidden = false; $('status').textContent = '';
  } finally { $('comparar').disabled = false; }
});
function apresentarComparacao(comparacao, captura) {
  const contar = situacao => comparacao.servicos.filter(s => s.situacao === situacao).length;
  const localizados = contar('localizado');
  const andamento = localizados === comparacao.servicos.length
    ? 'Todos os serviços desta lista foram localizados na captura. Não os inclua novamente. Confira a vigência e os avisos abaixo.'
    : `${localizados} de ${comparacao.servicos.length} serviço(s) localizado(s); ${contar('preenchido_sem_salvar')} preenchido(s) sem salvar; ${contar('conflito')} em conflito; ${contar('nao_localizado_na_captura')} não localizado(s) nesta captura.`;
  $('resumo').textContent = `${andamento} ${comparacao.totalVinculosVisiveis} vínculo(s) com ID e ${comparacao.totalVinculosPendentes} novo(s) pendente(s) visíveis. Esta comparação é parcial; confira também páginas, filtros, serviços herdados e vigência.`;
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
  $('automatico').hidden = !comparacao.servicos.some(s => s.situacao === 'nao_localizado_na_captura');
  if (planoDoPdf) $('pesquisa').hidden = true;
}
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
  selecaoParaSalvar = null; $('salvamento').hidden = true;
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
      if (preparacao.campos?.idVinculo === '0') {
        selecaoParaSalvar = {servico: {...servico}, campos: {...preparacao.campos}, tentativa: Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('')};
        $('servico-salvamento').textContent = `${servico.codigo} · ${servico.aliquota}% · ${preparacao.campos.nome}`;
        $('revisao-salvamento').checked = false; $('salvar-vinculo').disabled = true;
        $('status-salvamento').textContent = ''; $('salvamento').hidden = false;
      }
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

$('revisao-salvamento').addEventListener('change', () => {
  $('salvar-vinculo').disabled = salvando || !selecaoParaSalvar || !$('revisao-salvamento').checked;
});
$('salvar-vinculo').addEventListener('click', async () => {
  if (salvando || !resultado || !selecaoParaSalvar || !$('revisao-salvamento').checked) return;
  salvando = true;
  const atual = resultado;
  const pedido = {...selecaoParaSalvar, cnpjEsperado: atual.empresa.cnpj, cnpjConfirmado: $('cnpj').value,
    revisado: selecaoParaSalvar.revisado === true || $('conferido').checked, somenteEstaPendencia: true};
  const controles = [...document.querySelectorAll('input, button, select')];
  const anteriores = controles.map(e => e.disabled);
  controles.forEach(e => { e.disabled = true; });
  atual.salvo = null;
  atual.ultimoSalvamento = {ok: false, salvo: null, etapa: 'execucao_em_andamento', codigo: pedido.servico.codigo};
  $('status-salvamento').textContent = 'Conferindo o formulário e acionando Salvar uma vez…';
  try {
    const respostas = await chrome.scripting.executeScript({target: {tabId: aba}, func: salvarServicoCenti, args: [pedido]});
    const retorno = respostas[0]?.result;
    if (!retorno || typeof retorno.ok !== 'boolean') throw Error('A aba não retornou o resultado.');
    atual.ultimoSalvamento = {codigo: pedido.servico.codigo, ...retorno};
    atual.salvo = retorno.salvo;
    $('status-salvamento').textContent = retorno.mensagem;
  } catch (e) {
    atual.ultimoSalvamento = {ok: false, salvo: null, requerReleitura: true,
      codigo: pedido.servico.codigo, etapa: 'resultado_incerto', mensagem: `${e.message} Não repita o salvamento. Releia a pasta Serviços para conferir a persistência.`};
    $('status-salvamento').textContent = atual.ultimoSalvamento.mensagem;
  } finally {
    selecaoParaSalvar = null; salvando = false;
    controles.forEach((e, i) => { e.disabled = anteriores[i]; });
    $('revisao-salvamento').checked = false; $('salvar-vinculo').disabled = true;
  }
});

$('gerar-lista').href = Number.isSafeInteger(aba) && aba > 0 ? `consulta.html?aba=${aba}` : 'consulta.html';
if (new URLSearchParams(location.search).get('origem') === 'pdf') {
  try {
    planoDoPdf = receberPlanoDaAba(sessionStorage, aba);
    $('cnpj').value = planoDoPdf.empresa.cnpj;
    $('cnpj').readOnly = true;
    $('lista').required = false;
    $('lista').closest('label').hidden = true;
    $('lista').closest('label').nextElementSibling.hidden = true;
    $('origem-cartao').textContent = `${planoDoPdf.empresa.razaoSocial || 'Empresa do cartão'} · CNPJ ${planoDoPdf.empresa.cnpj} · ${planoDoPdf.servicos.length} serviço(s) conferido(s).`;
    $('origem-cartao').hidden = false;
    $('retomada').hidden = false;
    $('form-comparar').hidden = true;
  } catch (e) {
    $('erro').textContent = e.message; $('erro').hidden = false; $('comparar').disabled = true;
  }
}

$('autorizar-cadastro').addEventListener('change', () => {
  $('cadastrar-servicos').disabled = cadastrando || !$('autorizar-cadastro').checked;
});
$('cadastrar-servicos').addEventListener('click', async () => {
  if (cadastrando || !resultado || !planoAtual || !$('conferido').checked || !$('autorizar-cadastro').checked) return;
  cadastrando = true;
  const controles = [...document.querySelectorAll('input, button, select')];
  const anteriores = controles.map(e => e.disabled);
  controles.forEach(e => { e.disabled = true; });
  const executar = async (func, pedido, world = 'ISOLATED') => {
    const retorno = await chrome.scripting.executeScript({target: {tabId: aba}, func, args: pedido ? [pedido] : [], world});
    if (!retorno[0]?.result) throw Error('A Centi não retornou o resultado da ação.');
    return retorno[0].result;
  };
  const fases = {reler_servicos: 'Relendo os serviços…', abrir_vinculo: 'Abrindo vínculo novo…', pesquisar_selecionar: 'Pesquisando e selecionando serviço…', salvar: 'Salvando vínculo…', voltar_servicos: 'Voltando à lista para confirmar…'};
  try {
    const cadastro = await cadastrarServicos({plano: planoAtual, catalogo: catalogoAtual, cnpj: resultado.empresa.cnpj, ausenciaConferida: true}, {
      ler: () => executar(lerVinculosCenti),
      navegar: acao => executar(navegarServicosCenti, {acao}),
      selecionar: pedido => executar(pesquisarServicoCenti, pedido, 'MAIN'),
      salvar: pedido => executar(salvarServicoCenti, pedido),
      identificador: () => Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join(''),
      progresso: etapa => { $('status-cadastro').textContent = fases[etapa] || etapa; }
    });
    if (cadastro.comparacao) {
      resultado = {...cadastro.comparacao, captura: cadastro.ultimaCaptura, ultimoCadastro: cadastro,
        salvo: cadastro.resultadoIncerto ? null : cadastro.etapas.some(e => e.etapa === 'salvar' && e.resultado.salvo === true)};
      resultado.observacao = resultado.observacao.replace('; não houve preenchimento.', '.') + ' As ações executadas estão registradas no relatório de cadastro.';
      apresentarComparacao(resultado, cadastro.ultimaCaptura);
    } else resultado.ultimoCadastro = cadastro;
    $('status-cadastro').textContent = cadastro.mensagem;
    $('status').textContent = cadastro.concluido ? 'Cadastro dos serviços selecionados concluído e conferido na lista.' : 'Cadastro interrompido. Confira o relatório e a aba Centi.';
    $('automatico').hidden = false;
  } catch (e) {
    resultado.ultimoCadastro = {ok: false, concluido: false, resultadoIncerto: true, mensagem: e.message};
    $('status-cadastro').textContent = `${e.message} Confira a Centi antes de qualquer nova tentativa.`;
  } finally {
    controles.forEach((e, i) => { e.disabled = anteriores[i]; });
    cadastrando = false; $('autorizar-cadastro').checked = false;
    $('autorizar-cadastro').disabled = true; $('cadastrar-servicos').disabled = true;
  }
});

$('empresa-retomada').addEventListener('change', () => {
  $('retomar-preenchido').disabled = !$('empresa-retomada').checked;
});
$('retomar-preenchido').addEventListener('click', async () => {
  if (!planoDoPdf || !$('empresa-retomada').checked || cadastrando || salvando) return;
  const controles = [...document.querySelectorAll('input, button, select')];
  const anteriores = controles.map(e => e.disabled);
  controles.forEach(e => { e.disabled = true; });
  selecaoParaSalvar = null; $('salvamento').hidden = true;
  $('status-retomada').textContent = 'Conferindo o formulário já preenchido, sem alterá-lo…';
  try {
    const resposta = await fetch('data/servicos-centi-extraido.json');
    if (!resposta.ok) throw Error('Não foi possível carregar o catálogo.');
    const catalogo = await resposta.json();
    compararCaptura(planoDoPdf, {tipo: 'captura_vinculos_centi', registros: []}, catalogo, $('cnpj').value);
    const encontrados = [];
    for (const s of planoDoPdf.servicos) {
      const registro = catalogo.find(r => String(r.Id) === String(s.id));
      const servico = {...s, nome: registro.Nome};
      const respostas = await chrome.scripting.executeScript({target: {tabId: aba}, func: pesquisarServicoCenti,
        args: [{servico, conferirManual: true, conferido: true, cnpjEsperado: planoDoPdf.empresa.cnpj, cnpjConfirmado: $('cnpj').value}]});
      const conferido = respostas[0]?.result;
      if (conferido?.ok && conferido.selecionado && conferido.campos?.idVinculo === '0') encontrados.push({servico, conferido});
    }
    if (encontrados.length !== 1) throw Error('Não foi encontrado um único vínculo novo preenchido correspondente à lista do cartão. Confira o Serviço e feche a lupa.');
    const {servico, conferido} = encontrados[0];
    resultado = {tipo: 'retomada_vinculo_centi', empresa: {cnpj: planoDoPdf.empresa.cnpj}, servicos: planoDoPdf.servicos,
      salvo: false, ultimaPesquisa: conferido};
    selecaoParaSalvar = {servico, campos: conferido.campos, revisado: true,
      tentativa: Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('')};
    $('resumo').textContent = 'Vínculo já preenchido conferido. Esta etapa não releu a tabela Serviços nem criou registros.';
    $('servicos-comparados').replaceChildren(); $('nao-identificados').replaceChildren(); $('aviso').textContent = '';
    $('resultado').hidden = false; $('automatico').hidden = true; $('pesquisa').hidden = true;
    $('servico-salvamento').textContent = `${servico.codigo} · ${servico.aliquota}% · ${conferido.campos.nome}`;
    $('status-salvamento').textContent = ''; $('revisao-salvamento').checked = false;
    $('salvamento').hidden = false;
    $('status-retomada').textContent = 'Vínculo atual conferido. Revise os dados e use Salvar vínculo na Centi abaixo.';
  } catch (e) { $('status-retomada').textContent = `${e.message} Nenhum botão Novo ou Salvar foi acionado.`; }
  finally {
    controles.forEach((e, i) => { e.disabled = anteriores[i]; });
    $('salvar-vinculo').disabled = true;
  }
});

async function verificarConexao() {
  if (verificandoConexao || !Number.isSafeInteger(aba)) return;
  verificandoConexao = true;
  try {
    const respostas = await chrome.scripting.executeScript({target: {tabId: aba}, func: inspecionarConexaoCenti});
    const leitura = respostas[0]?.result;
    if (!leitura || ['aguardando_login', 'fora_da_centi', 'carregando'].includes(leitura.estado)) {
      $('status-conexao').textContent = 'Entre na Centi na aba aberta. O aplicativo verificará a conexão novamente.';
      return;
    }
    diagnosticoConexao = leitura;
    $('status-conexao').textContent = leitura.possuiFormularioServico
      ? 'Centi acessível. Há um formulário de Serviço aberto; suas alterações foram preservadas.'
      : 'Centi acessível. Você pode localizar a empresa do cartão automaticamente.';
    if (planoDoPdf && !localizandoEmpresa && !empresaLocalizada && !leitura.possuiFormularioServico) void localizarEmpresa();
    $('baixar-conexao').hidden = false;
  } catch {
    $('status-conexao').textContent = 'Aguardando a Centi carregar ou o acesso ser concluído. Se a aba foi fechada, use Abrir ou reconectar Centi.';
  } finally { verificandoConexao = false; }
}
async function abrirConexao() {
  if (localizandoEmpresa || cadastrando || salvando) return;
  diagnosticoConexao = null;
  $('abrir-centi').disabled = true;
  try {
    const conexao = await conectarCenti(chrome, aba);
    aba = conexao.aba;
    $('status-conexao').textContent = conexao.criada ? 'Centi aberta. Entre no sistema se necessário; o cartão e os serviços continuam neste aplicativo.' : 'Aba Centi conectada.';
    await verificarConexao();
  } catch (e) { $('status-conexao').textContent = `${e.message} Confira se a extensão está habilitada para acessar ba.centi.com.br.`; }
  finally { $('abrir-centi').disabled = false; }
}
$('abrir-centi').addEventListener('click', abrirConexao);
$('baixar-conexao').addEventListener('click', async () => {
  $('baixar-conexao').disabled = true;
  try {
    const leituras = await chrome.scripting.executeScript({target:{tabId:aba},func:inspecionarConexaoCenti});
    const atual = leituras[0]?.result;
    if (!atual) throw Error('Não foi possível ler a tela atual da Centi.');
    diagnosticoConexao = {...atual, lidoEm: new Date().toISOString(), falhaLocalizacao};
    const url = URL.createObjectURL(new Blob([JSON.stringify(diagnosticoConexao, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'mapa-conexao-centi.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch(e) { $('status-conexao').textContent = e.message; }
  finally { $('baixar-conexao').disabled = false; }
});
if (planoDoPdf && !Number.isSafeInteger(aba)) {
  void abrirConexao();
}
setInterval(() => { if (!diagnosticoConexao && planoDoPdf && !cadastrando && !salvando) void verificarConexao(); }, 2500);

async function localizarEmpresa() {
  if (!planoDoPdf || localizandoEmpresa || cadastrando || salvando) return;
  localizandoEmpresa = true; empresaLocalizada = false; falhaLocalizacao = null;
  const controles = [...document.querySelectorAll('input,button,select')];
  const anteriores = controles.map(e => e.disabled);controles.forEach(e => {e.disabled=true;});
  const executar = async (func,pedido,world='ISOLATED') => {
    let respostas;
    try { respostas = await chrome.scripting.executeScript({target:{tabId:aba},func,args:[pedido],world}); }
    catch(e) {
      falhaLocalizacao = {funcao:func.name,etapa:'erro_execucao',mensagem:'O navegador não retornou a execução nesta etapa.'};
      throw e;
    }
    const retorno=respostas[0]?.result;
    if (!retorno?.ok) {
      falhaLocalizacao = {funcao:func.name,etapa:retorno?.etapa || 'sem_retorno',mensagem:retorno?.mensagem || 'A ação na Centi não foi confirmada.', diagnosticoNavegacao:retorno?.diagnosticoNavegacao || null};
      throw Error(falhaLocalizacao.mensagem);
    }
    return retorno;
  };
  try {
    if (!Number.isSafeInteger(aba)) {const conexao=await conectarCenti(chrome);aba=conexao.aba;}
    $('status-localizacao').textContent='Abrindo AR022 e pesquisando o CNPJ do cartão…';
    const encontrado=await executar(pesquisarEmpresaCenti,{cnpj:planoDoPdf.empresa.cnpj});
    $('status-localizacao').textContent='Empresa localizada. Abrindo o cadastro pelo resultado exato…';
    const aberto=await executar(abrirEmpresaCenti,encontrado,'MAIN');
    if (aberto.empresaConferida !== true) throw Error('A identidade da empresa não foi confirmada.');
    $('status-localizacao').textContent='Empresa conferida. Abrindo a pasta Serviços…';
    await executar(navegarServicosCenti,{acao:'lista'});
    empresaLocalizada=true;
    $('conferido').checked=true;
    $('status-localizacao').textContent='Empresa e pasta Serviços abertas automaticamente. Lendo os vínculos…';
  } catch(e) { $('status-localizacao').textContent=`${e.message} Nenhuma empresa nova foi criada. Use Baixar mapa da tela Centi se a navegação não foi identificada.`; }
  finally {
    controles.forEach((e,i)=>{e.disabled=anteriores[i];});localizandoEmpresa=false;
    if(empresaLocalizada) $('form-comparar').requestSubmit();
  }
}
$('localizar-empresa').addEventListener('click',localizarEmpresa);
