const texto = valor => typeof valor === 'string' ? valor.trim() : '';
const canonico = valor => texto(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export function normalizarCnpj(valor) {
  const entrada = texto(valor);
  if (!/^[\d./\-\s]+$/.test(entrada)) throw Error('Informe um CNPJ numérico válido.');
  const cnpj = entrada.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) throw Error('Informe um CNPJ numérico válido, com 14 dígitos.');
  for (const tamanho of [12, 13]) {
    const pesos = tamanho === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const resto = pesos.reduce((soma, peso, i) => soma + Number(cnpj[i]) * peso, 0) % 11;
    if (Number(cnpj[tamanho]) !== (resto < 2 ? 0 : 11 - resto)) throw Error('O CNPJ informado tem dígitos verificadores inválidos.');
  }
  return cnpj;
}

export function formatarCnpj(valor) {
  return normalizarCnpj(valor).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function normalizarCnae(valor) {
  const entrada = Number.isInteger(valor) && valor > 0 && valor <= 9999999 ? String(valor).padStart(7, '0') : String(valor ?? '');
  if (!/^(?:\d{7}|\d{4}-\d\/\d{2})$/.test(entrada)) throw Error('A consulta retornou um CNAE inválido.');
  const digitos = entrada.replace(/\D/g, '');
  if (digitos === '0000000') throw Error('A consulta não informou um CNAE válido.');
  return digitos.replace(/^(\d{4})(\d)(\d{2})$/, '$1-$2/$3');
}

export function definirAliquota({coworking, porte, porteManual = ''}) {
  if (coworking !== true && coworking !== false) throw Error('Informe se a empresa se enquadra em coworking.');
  if (coworking) return { valor: '2,00', motivo: 'Empresa em coworking' };
  const p = canonico(porte);
  if (['DEMAIS', 'GRANDE PORTE', 'EMPRESA DE GRANDE PORTE'].includes(p)) return { valor: '5,00', motivo: 'Empresa de grande porte / DEMAIS' };
  if (['MICRO EMPRESA', 'MICROEMPRESA', 'EMPRESA DE PEQUENO PORTE', 'ME', 'EPP', 'MEI', 'MICROEMPREENDEDOR INDIVIDUAL'].includes(p)) return { valor: '4,00', motivo: 'Empresa de outro porte, sem coworking' };
  if (porteManual === 'grande') return { valor: '5,00', motivo: 'Grande porte confirmado pelo operador' };
  if (porteManual === 'outros') return { valor: '4,00', motivo: 'Outro porte confirmado pelo operador, sem coworking' };
  throw Error('O porte não foi reconhecido. Confirme a classificação para definir a alíquota.');
}

export function converterServicos(empresa, opcoes, mapa, catalogo) {
  const aliquota = definirAliquota({...opcoes, porte: empresa.porte});
  const porCodigo = new Map();
  const semCorrespondencia = [];
  for (const cnae of empresa.cnaes) {
    const relacoes = Object.hasOwn(mapa, cnae.codigo) ? mapa[cnae.codigo] : null;
    if (!relacoes?.length) { semCorrespondencia.push(cnae); continue; }
    for (const relacao of relacoes) {
      if (!/^\d{2}\.\d{2}$/.test(relacao.code)) throw Error('Há um código ISS inválido na base de correspondências.');
      if (!porCodigo.has(relacao.code)) porCodigo.set(relacao.code, {
        codigoIss: relacao.code, codigo: relacao.code + '.000', descricoes: [], origens: []
      });
      const servico = porCodigo.get(relacao.code);
      if (!servico.descricoes.includes(relacao.desc)) servico.descricoes.push(relacao.desc);
      if (!servico.origens.some(x => x.codigo === cnae.codigo)) servico.origens.push(cnae);
    }
  }
  const servicos = [...porCodigo.values()].sort((a,b) => a.codigo.localeCompare(b.codigo)).map(servico => {
    const candidatos = catalogo.filter(r => r.CodigoCompleto === servico.codigo && r.Aliquota === aliquota.valor && r.Situacao === 'Ativo')
      .map(r => ({ id: r.Id, codigo: r.CodigoCompleto, nome: r.Nome, aliquota: r.Aliquota }));
    return {...servico, candidatos, situacao: candidatos.length === 1 ? 'disponivel' : candidatos.length ? 'ambiguo' : 'indisponivel'};
  });
  return {aliquota, servicos, semCorrespondencia};
}

export function criarPlano(empresa, opcoes, mapa, catalogo, selecoes, agora = new Date()) {
  const conversao = converterServicos(empresa, opcoes, mapa, catalogo);
  if (!Array.isArray(selecoes) || !selecoes.length) throw Error('Selecione pelo menos um serviço para conferir.');
  const vistos = new Set();
  const servicos = selecoes.map(({codigo, id}) => {
    if (vistos.has(codigo)) throw Error('Um serviço foi selecionado mais de uma vez.');
    vistos.add(codigo);
    const sugestao = conversao.servicos.find(s => s.codigo === codigo);
    const registro = sugestao?.candidatos.filter(c => c.id === id);
    if (registro?.length !== 1) throw Error('A seleção não corresponde a um registro único com a alíquota definida.');
    return {...registro[0], cnaes: sugestao.origens.map(c => c.codigo)};
  });
  const dataInicio = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(agora);
  return { versao: 1, tipo: 'lista_servicos_conferida', geradoEm: agora.toISOString(),
    empresa: {...empresa, cnaes: empresa.cnaes.map(c => ({...c}))},
    enquadramento: {coworking: opcoes.coworking, porteManual: opcoes.porteManual || null, ...conversao.aliquota},
    servicos, semCorrespondencia: conversao.semCorrespondencia, listaPossivelmenteIncompleta: conversao.semCorrespondencia.length > 0,
    cadastro: { dataInicio, dataInicioDeveSerRecalculadaAoPreencher: true, dataFim: null, especificarCnae: false },
    conferidoPeloOperador: true, preenchidoNaCenti: false, salvo: false };
}
