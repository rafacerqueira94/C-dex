// O adaptador da tela Centi deve fornecer todos os registros, inclusive paginação.
// A comparação apenas prepara a operação; não escreve nem salva na Centi.
const identificador = valor => typeof valor === 'string' || Number.isSafeInteger(valor)
  ? String(valor).trim() : '';
const codigoValido = valor => typeof valor === 'string' && /^\d{2}\.\d{2}\.\d{3}$/.test(valor);
const aliquotaValida = valor => typeof valor === 'string' && /^\d{1,2},\d{2}$/.test(valor);
const registroValido = registro => registro && codigoValido(registro.codigo)
  && identificador(registro.id) !== '' && aliquotaValida(registro.aliquota);

// Id da grade de vínculos NÃO é o Id do catálogo municipal.
// Esta função recebe dados já extraídos e verificados da empresa correta.
// Não estabelece completude da leitura, vigência ou origem direta/herdada.
export function normalizarVinculosCenti(vinculos, catalogo) {
  if (!Array.isArray(vinculos) || !Array.isArray(catalogo)) {
    throw Error('Vínculos e catálogo devem ser listas.');
  }
  return vinculos.map(v => {
    if (!v || !/^[1-9]\d*$/.test(identificador(v.idVinculo))
        || !codigoValido(v.codigo) || !aliquotaValida(v.aliquota)) {
      throw Error('Vínculo sem ID, código ou alíquota válidos.');
    }
    const candidatos = catalogo.filter(r => r.CodigoCompleto === v.codigo
      && r.Aliquota === v.aliquota && r.Situacao === 'Ativo'
      && /^[1-9]\d*$/.test(identificador(r.Id))
      && (v.idMunicipal == null || identificador(r.Id) === identificador(v.idMunicipal)));
    return {
      idVinculo: identificador(v.idVinculo), codigo: v.codigo, aliquota: v.aliquota,
      id: candidatos.length === 1 ? identificador(candidatos[0].Id) : null,
      identificacao: candidatos.length === 1 ? 'catalogo_unico' : 'nao_resolvida'
    };
  });
}

export function conciliarServicos(plano, cadastrados, {leituraCompleta = false} = {}) {
  if (plano?.tipo !== 'lista_servicos_conferida' || plano.conferidoPeloOperador !== true
      || !Array.isArray(plano.servicos) || !plano.servicos.length
      || !plano.servicos.every(registroValido)) {
    throw Error('É necessária uma lista conferida com serviços identificados.');
  }
  if (!Array.isArray(cadastrados)) throw Error('A leitura dos serviços cadastrados deve ser uma lista.');
  const codigos = new Set();
  for (const servico of plano.servicos) {
    if (codigos.has(servico.codigo)) throw Error('A lista conferida contém um código de serviço repetido.');
    codigos.add(servico.codigo);
  }
  const leituraSegura = leituraCompleta === true && cadastrados.every(registroValido);
  const servicos = plano.servicos.map(servico => {
    if (!leituraSegura) return {...servico, situacao: 'bloqueado', motivo: 'Leitura incompleta ou registro cadastrado sem identificação suficiente.'};
    const porCodigo = cadastrados.filter(r => r.codigo === servico.codigo);
    const porId = cadastrados.filter(r => identificador(r.id) === identificador(servico.id));
    if (porCodigo.length === 1 && porId.length === 1 && porCodigo[0] === porId[0]
        && porCodigo[0].aliquota === servico.aliquota) {
      return {...servico, situacao: 'ja_cadastrado'};
    }
    if (porCodigo.length || porId.length) {
      return {...servico, situacao: 'conflito', motivo: 'Código, registro municipal ou alíquota divergente, ou cadastro duplicado.'};
    }
    return {...servico, situacao: 'pendente'};
  });
  return {
    servicos,
    podePreencher: leituraSegura && !servicos.some(s => s.situacao === 'conflito'),
    pendentes: servicos.filter(s => s.situacao === 'pendente'),
    jaCadastrados: servicos.filter(s => s.situacao === 'ja_cadastrado'),
    conflitos: servicos.filter(s => s.situacao === 'conflito'),
    bloqueados: servicos.filter(s => s.situacao === 'bloqueado')
  };
}
