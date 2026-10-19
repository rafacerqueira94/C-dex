import {importarCartaoPdf} from './pdf.mjs';
import {converterServicos, criarPlano, definirAliquota, formatarCnpj} from './dominio.mjs';
const $ = id => document.getElementById(id);
const estado = {empresa: null, mapa: null, catalogo: null, conversao: null, plano: null, controle: null, sequencia: 0, anexoUrl: null};
const rotuloBotao = () => 'Ler cartão e sugerir serviços';
const coworking = () => document.querySelector('input[name=coworking]:checked')?.value;
const opcoes = () => ({coworking: coworking() === 'sim' ? true : coworking() === 'nao' ? false : null, porteManual: $('porte-manual').value});
const elemento = (tag, texto, classe) => {const el = document.createElement(tag); if(texto != null) el.textContent = texto; if(classe) el.className = classe; return el;};
const erro = mensagem => { $('erro').textContent = mensagem || ''; $('erro').hidden = !mensagem; };
function invalidarConferencia() { estado.plano = null; $('resultado').hidden = true; $('aceite').checked = false; }
function limparConsulta() {
  estado.sequencia++; estado.controle?.abort(); estado.controle = null;
  estado.empresa = null; estado.conversao = null; invalidarConferencia();
  for (const id of ['empresa', 'revisao']) $(id).hidden = true;
  $('porte-manual').value = ''; $('status').textContent = ''; erro('');
  if (estado.anexoUrl) URL.revokeObjectURL(estado.anexoUrl); estado.anexoUrl = null; $('anexo').hidden = true;
  $('consultar').disabled = !estado.mapa; $('consultar').textContent = rotuloBotao();
}
function selecoes() {
  return [...$('servicos').querySelectorAll('input[type=checkbox]:checked')].map(input => {
    const linha = input.closest('tr');
    return {codigo: linha.dataset.codigo, id: linha.querySelector('select')?.value || linha.dataset.id};
  });
}
function atualizarContagem() {
  const total = selecoes().length;
  $('contagem').textContent = `${total} serviço${total === 1 ? '' : 's'} selecionado${total === 1 ? '' : 's'}.`;
  $('confirmar').disabled = total === 0 || !$('aceite').checked;
}
function renderizarEmpresa() {
  const e = estado.empresa;
  $('empresa').hidden = false; $('razao').textContent = e.razaoSocial;
  $('dados-empresa').replaceChildren();
  for (const [nome, valor] of [['CNPJ',formatarCnpj(e.cnpj)],['Nome fantasia',e.nomeFantasia || 'Não informado'],['Porte',e.porte || 'Não informado'],['Situação cadastral',e.situacao || 'Não informada'],['Município / UF',[e.municipio,e.uf].filter(Boolean).join(' / ') || 'Não informado'],['Fonte e leitura',`${e.fonte} · ${new Date(e.consultadoEm).toLocaleString('pt-BR')}`]]) {
    const grupo = elemento('div'); grupo.append(elemento('dt',nome),elemento('dd',valor)); $('dados-empresa').append(grupo);
  }
  $('cnaes').replaceChildren(...e.cnaes.map(c => elemento('li',`${c.codigo} — ${c.descricao || 'Descrição não informada'} (${c.principal ? 'principal' : 'secundário'})`)));
  $('situacao-aviso').hidden = e.situacao.trim().toUpperCase() === 'ATIVA';
  $('situacao-aviso').textContent = 'A situação cadastral não foi informada como ATIVA. Confira a situação antes do cadastro municipal.';
}
function renderizarConversao() {
  if (!estado.empresa) return;
  invalidarConferencia(); estado.conversao = null; $('revisao').hidden = true;
  const opts = opcoes();
  try { definirAliquota({...opts,porte:estado.empresa.porte}); $('classificacao').hidden = true; }
  catch (e) { $('classificacao').hidden = opts.coworking == null; erro(e.message); return; }
  // Se a classificação manual definiu a alíquota, mantê-la visível para revisão.
  try { definirAliquota({coworking: opts.coworking, porte:estado.empresa.porte}); }
  catch { $('classificacao').hidden = false; }
  erro('');
  const conversao = converterServicos(estado.empresa, opts, estado.mapa, estado.catalogo);
  estado.conversao = conversao; $('revisao').hidden = false;
  $('aliquota').textContent = `Alíquota: ${conversao.aliquota.valor}% · ${conversao.aliquota.motivo}`;
  $('lacunas').hidden = !conversao.semCorrespondencia.length;
  $('lacunas').replaceChildren();
  if (conversao.semCorrespondencia.length) {
    $('lacunas').append(elemento('strong','A lista pode estar incompleta.'),elemento('p','Estes CNAEs não têm correspondência na base fornecida e precisam de análise:'));
    const lista = elemento('ul'); lista.append(...conversao.semCorrespondencia.map(c => elemento('li',`${c.codigo} — ${c.descricao || 'Descrição não informada'}`))); $('lacunas').append(lista);
  }
  $('sem-servicos').hidden = !!conversao.servicos.length;
  $('sem-servicos').textContent = 'Nenhum serviço foi identificado na base para estes CNAEs. É necessário analisar as correspondências antes de continuar.';
  $('servicos').replaceChildren();
  for (const s of conversao.servicos) {
    const linha = elemento('tr'); linha.dataset.codigo = s.codigo;
    const celula = elemento('td'), check = elemento('input'); check.type = 'checkbox'; check.setAttribute('aria-label', `Selecionar serviço ${s.codigo}`); celula.append(check);
    const servico = elemento('td'); servico.append(elemento('strong',s.codigo),elemento('div',s.descricoes.join(' / ')));
    const origens = elemento('td'), lista = elemento('ul'); lista.append(...s.origens.map(c => elemento('li',`${c.codigo} — ${c.descricao || 'Descrição não informada'}`))); origens.append(lista);
    const registro = elemento('td');
    if (s.candidatos.length === 1) {
      const c = s.candidatos[0]; linha.dataset.id = c.id; registro.append(elemento('div',c.nome),elemento('small',`ID ${c.id} · ${c.aliquota}%`));
    } else if (s.candidatos.length > 1) {
      check.disabled = true; const select = elemento('select'); select.setAttribute('aria-label',`Registro municipal ${s.codigo}`);
      const vazio = elemento('option','Escolha o registro'); vazio.value = ''; select.append(vazio);
      for (const c of s.candidatos) {const option = elemento('option',`ID ${c.id} · ${c.nome}`); option.value = c.id; select.append(option);}
      registro.append(elemento('div','Mais de um registro com a mesma alíquota.'),select);
      select.addEventListener('change',() => { check.checked = false; check.disabled = !select.value; invalidarConferencia(); atualizarContagem(); });
    } else {
      check.disabled = true; registro.append(elemento('div',`Sem registro ativo para ${conversao.aliquota.valor}%.`,'indisponivel'));
    }
    check.addEventListener('change',() => { invalidarConferencia(); atualizarContagem(); });
    linha.append(celula,servico,origens,registro); $('servicos').append(linha);
  }
  atualizarContagem();
}
$('arquivo-pdf').addEventListener('change',limparConsulta);
window.addEventListener('beforeunload',() => { if(estado.anexoUrl) URL.revokeObjectURL(estado.anexoUrl); });
for (const input of document.querySelectorAll('input[name=coworking]')) input.addEventListener('change',() => { erro(''); renderizarConversao(); });
$('porte-manual').addEventListener('change',renderizarConversao);
$('aceite').addEventListener('change',() => { estado.plano = null; $('resultado').hidden = true; atualizarContagem(); });
$('form-consulta').addEventListener('submit',async evento => {
  evento.preventDefault(); limparConsulta();
  const sequencia = estado.sequencia, controle = new AbortController(); estado.controle = controle;
  const arquivo = $('arquivo-pdf').files[0];
  $('consultar').disabled = true; $('consultar').textContent = 'Lendo PDF…'; $('status').textContent = 'Lendo o cartão CNPJ anexado…';
  try {
    const empresa = await importarCartaoPdf(arquivo,{signal:controle.signal});
    if (sequencia !== estado.sequencia) return;
    estado.empresa = empresa;
    estado.anexoUrl = URL.createObjectURL(arquivo); $('visualizar-pdf').href = estado.anexoUrl; $('nome-anexo').textContent = ' · ' + arquivo.name; $('anexo').hidden = false;
    renderizarEmpresa(); renderizarConversao(); $('status').textContent = 'PDF lido. Confira CNPJ, razão social, porte e CNAEs com o cartão anexado.';
  } catch (e) { if (sequencia === estado.sequencia) { erro(e.message); $('status').textContent = ''; } }
  finally { if (sequencia === estado.sequencia) { $('consultar').disabled = false; $('consultar').textContent = rotuloBotao(); estado.controle = null; } }
});
$('form-confirmacao').addEventListener('submit',evento => {
  evento.preventDefault();
  try {
    if (!$('aceite').checked) throw Error('Confirme a conferência dos dados antes de continuar.');
    estado.plano = criarPlano(estado.empresa,opcoes(),estado.mapa,estado.catalogo,selecoes());
    const plano = estado.plano; $('resultado').hidden = false;
    $('titulo-resultado').textContent = `${plano.servicos.length} serviço${plano.servicos.length === 1 ? '' : 's'} na lista conferida`;
    $('resumo').textContent = `${plano.empresa.razaoSocial} · ${formatarCnpj(plano.empresa.cnpj)} · alíquota ${plano.enquadramento.valor}%`;
    $('lista-final').replaceChildren(...plano.servicos.map(s => elemento('li',`${s.codigo} · ID ${s.id} · ${s.nome} · ${s.aliquota}%`)));
    $('aviso-final').textContent = plano.listaPossivelmenteIncompleta ? 'Há CNAEs sem correspondência. Esta lista não cobre necessariamente todas as atividades da empresa.' : 'Lista gerada a partir das correspondências disponíveis na base fornecida.';
    $('resultado').scrollIntoView({behavior:'smooth',block:'start'}); erro('');
  } catch(e) { erro(e.message); }
});
$('exportar').addEventListener('click',() => {
  if (!estado.plano) return;
  const blob = new Blob([JSON.stringify(estado.plano,null,2)],{type:'application/json'}), url = URL.createObjectURL(blob);
  const a = elemento('a'); a.href = url; a.download = `servicos-conferidos-${estado.plano.empresa.cnpj}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
});
try {
  const arquivos = await Promise.all(['cnae-iss-extraido.json','servicos-centi-extraido.json'].map(async nome => {
    const resposta = await fetch(`data/${nome}`); if(!resposta.ok) throw Error('Não foi possível carregar as bases de serviços. Reinstale o pacote completo.'); return resposta.json();
  }));
  [estado.mapa,estado.catalogo] = arquivos; $('consultar').disabled = false; $('status').textContent = 'Anexe o cartão CNPJ em PDF e informe o enquadramento em coworking.';
} catch(e) { erro(e.message); $('status').textContent = ''; }
