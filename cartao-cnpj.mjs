import {normalizarCnpj, normalizarCnae} from './dominio.mjs';
const normal = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
const rotulos = [
  ['nome','NOME EMPRESARIAL'], ['fantasia','TITULO DO ESTABELECIMENTO \\(NOME DE FANTASIA\\)'],
  ['porte','PORTE'], ['principal','CODIGO E DESCRICAO DA ATIVIDADE ECONOMICA PRINCIPAL'],
  ['secundaria','CODIGO E DESCRICAO DAS ATIVIDADES ECONOMICAS SECUNDARIAS'],
  ['natureza','CODIGO E DESCRICAO DA NATUREZA JURIDICA'],
  ['municipio','MUNICIPIO'], ['uf','UF'], ['situacao','SITUACAO CADASTRAL'],
  ['outro','NUMERO DE INSCRICAO'], ['outro','DATA DE ABERTURA'],
  ['outro','DATA DE CONSTITUICAO'], ['outro','DATA DE INSCRICAO NO CNPJ'], ['outro','LOGRADOURO'],
  ['outro','NUMERO'], ['outro','COMPLEMENTO'], ['outro','CEP'], ['outro','BAIRRO/DISTRITO'],
  ['outro','ENDERECO ELETRONICO'], ['outro','TELEFONE'], ['outro','ENTE FEDERATIVO RESPONSAVEL \\(EFR\\)'],
  ['outro','DATA DA SITUACAO CADASTRAL'], ['outro','MOTIVO DE SITUACAO CADASTRAL'],
  ['outro','SITUACAO ESPECIAL'], ['outro','DATA DA SITUACAO ESPECIAL']
];

// Recebe coordenadas já transformadas para a orientação visual da página.
export function organizarLinhas(itens, pagina) {
  const linhas=[];
  for(const item of itens.filter(i=>i.texto.trim()).sort((a,b)=>a.y-b.y||a.x-b.x)) {
    let linha=linhas.find(l=>Math.abs(l.y-item.y)<=2);
    if(!linha){linha={pagina,y:item.y,itens:[]};linhas.push(linha);}
    linha.itens.push(item);
  }
  return linhas.sort((a,b)=>a.y-b.y).map(l=>{
    l.itens.sort((a,b)=>a.x-b.x);
    let pos=0;
    const partes=l.itens.map(i=>{
      const texto=normal(i.texto),parte={...i,texto,inicio:pos,fim:pos+texto.length};pos+=texto.length+1;return parte;
    });
    return {...l,itens:partes,texto:partes.map(p=>p.texto).join(' ')};
  });
}

function localizarRotulos(linhas) {
  const encontrados=[];
  linhas.forEach((linha,indice)=>{
    for(const [campo,rotulo] of rotulos) {
      const re=new RegExp('(?:^| )('+rotulo+')(?:$| )','g');
      for(const match of linha.texto.matchAll(re)) {
        const inicio=match.index+(match[0].startsWith(' ')?1:0);
        const item=linha.itens.find(i=>i.inicio<=inicio&&i.fim>inicio);
        if(!item)continue;
        // Rótulos curtos são aceitos somente como item completo para não confundir nomes empresariais.
        if((['porte','municipio','uf','situacao'].includes(campo)||(campo==='outro'&&rotulo.length<25))&&item.texto!==match[1])continue;
        const x=item.x+(inicio-item.inicio)/Math.max(item.texto.length,1)*item.largura;
        encontrados.push({campo,indice,pagina:linha.pagina,x,y:linha.y});
      }
    }
  });
  return encontrados;
}

export function extrairCartaoCnpj(linhas) {
  const texto=linhas.map(l=>l.texto).join('\n');
  if(texto.length<50)throw Error('O PDF não tem texto extraível. Anexe o cartão salvo como PDF pela Receita; imagens digitalizadas precisam de OCR.');
  if(!texto.includes('CADASTRO NACIONAL DA PESSOA JURIDICA')||!texto.includes('COMPROVANTE DE INSCRICAO'))throw Error('Não reconheci o comprovante de inscrição e situação cadastral do CNPJ. Anexe o cartão completo da Receita Federal.');
  const identificacoes=[...new Set([...texto.matchAll(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g)].map(m=>normalizarCnpj(m[0])))];
  if(identificacoes.length!==1)throw Error('O PDF precisa conter um único CNPJ identificável. Anexe um cartão por vez.');
  const anchors=localizarRotulos(linhas);
  function campo(tipo, obrigatorio=false) {
    const valores=[];
    for(const anchor of anchors.filter(a=>a.campo===tipo)) {
      const direita=anchors.filter(a=>a.indice===anchor.indice&&a.x>anchor.x+3).sort((a,b)=>a.x-b.x)[0]?.x??Infinity;
      const proximo=anchors.find(a=>a.indice>anchor.indice);
      const fim=proximo?.indice??linhas.length;
      const partes=[];
      for(let i=anchor.indice+1;i<fim;i++) {
        if(linhas[i].pagina!==anchor.pagina)break;
        const itens=linhas[i].itens.filter(t=>t.x>=anchor.x-3&&t.x<direita-2);
        if(itens.length)partes.push(itens.map(t=>t.texto).join(' '));
      }
      const valor=partes.join(' ').trim();if(valor&&!valores.includes(valor))valores.push(valor);
    }
    if(valores.length>1)throw Error('Encontrei valores divergentes no campo '+tipo+'. Anexe somente um cartão completo.');
    if(obrigatorio&&!valores.length)throw Error('Não consegui ler o campo '+tipo+' do cartão. Anexe o PDF completo com texto selecionável.');
    return valores[0]||'';
  }
  function atividades(tipo) {
    const blocos=[];
    for(const anchor of anchors.filter(a=>a.campo===tipo)) {
      let fim=anchors.find(a=>a.indice>anchor.indice)?.indice??linhas.length;
      blocos.push(linhas.slice(anchor.indice+1,fim).map(l=>l.texto).join(' '));
    }
    if(!blocos.length)throw Error('Não localizei o bloco de atividades '+(tipo==='principal'?'principal':'secundárias')+'. Anexe o cartão completo.');
    const resultado=new Map();
    for(const bloco of blocos) {
      const regex=/\b(?:\d{2}\.\d{2}|\d{4})-\d[-/]\d{2}\b/g;
      const encontrados=[...bloco.matchAll(regex)];
      const possiveis=[...bloco.matchAll(/\b(?:\d{2}\.\d{2}|\d{4})-[A-Z0-9][-\/][A-Z0-9]{1,3}\b/g)];
      if(possiveis.length!==encontrados.length)throw Error('Há um código CNAE ilegível ou incompleto no PDF. Confira o cartão e anexe uma versão legível.');
      if(!encontrados.length&&!(tipo==='secundaria'&&/^NAO INFORMAD[AO](?:S)?[ .]*$/.test(bloco)))throw Error('Não consegui ler os CNAEs '+(tipo==='principal'?'do bloco principal':'secundários')+'. Anexe o PDF completo com texto selecionável.');
      encontrados.forEach((match,i)=>{
        const codigo=normalizarCnae(match[0].replace(/\D/g,''));
        const descricao=bloco.slice(match.index+match[0].length,encontrados[i+1]?.index??bloco.length).replace(/^\s*[-–]\s*/,'').trim();
        if(!resultado.has(codigo))resultado.set(codigo,{codigo,descricao,principal:tipo==='principal'});
      });
    }
    if(tipo==='principal'&&resultado.size!==1)throw Error('Não foi possível identificar uma única atividade principal no cartão.');
    return [...resultado.values()];
  }
  const principal=atividades('principal'),secundarias=atividades('secundaria');
  const cnaes=new Map([...principal,...secundarias].map(c=>[c.codigo,c]));
  // A atividade principal prevalece quando reaparece nas secundárias.
  cnaes.set(principal[0].codigo,principal[0]);
  const porte=campo('porte');
  return {cnpj:identificacoes[0],razaoSocial:campo('nome',true),nomeFantasia:campo('fantasia').replace(/^\*+$/,''),porte,
    municipio:campo('municipio'),uf:campo('uf'),situacao:campo('situacao'),cnaes:[...cnaes.values()],
    fonte:'Cartão CNPJ em PDF',consultadoEm:new Date().toISOString(),
    avisos:porte?[]:['O porte não foi identificado no PDF. Confirme a classificação da empresa.']};
}
