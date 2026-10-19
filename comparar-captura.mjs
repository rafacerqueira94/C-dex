import {normalizarCnpj} from './dominio.mjs';

const normal = valor => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
const codigoValido = valor => typeof valor === 'string' && /^\d{2}\.\d{2}\.\d{3}$/.test(valor);
const idValido = valor => (typeof valor === 'string' || Number.isSafeInteger(valor)) && /^[1-9]\d*$/.test(String(valor));

export function compararCaptura(plano, captura, catalogo, cnpjConfirmado) {
  if (plano?.tipo !== 'lista_servicos_conferida' || plano.conferidoPeloOperador !== true
      || !Array.isArray(plano.servicos) || !plano.servicos.length) throw Error('Importe uma lista conferida exportada pelo Ponte Centi.');
  if (normalizarCnpj(plano.empresa?.cnpj) !== normalizarCnpj(cnpjConfirmado)) throw Error('O CNPJ confirmado não corresponde à lista importada.');
  if (captura?.tipo !== 'captura_vinculos_centi' || !Array.isArray(captura.registros) || !Array.isArray(catalogo)) {
    throw Error('Captura ou catálogo inválido.');
  }
  const codigos = new Set();
  for (const s of plano.servicos) {
    if (!codigoValido(s?.codigo) || !idValido(s.id) || !['2,00', '4,00', '5,00'].includes(s.aliquota)
        || codigos.has(s.codigo)) throw Error('A lista conferida possui serviço inválido ou código repetido.');
    codigos.add(s.codigo);
    const candidatos = catalogo.filter(r => String(r.Id) === String(s.id) && r.CodigoCompleto === s.codigo && r.Aliquota === s.aliquota && r.Situacao === 'Ativo');
    if (candidatos.length !== 1) throw Error('Um serviço da lista não corresponde ao catálogo atual.');
  }
  const resolver = (v, pendente) => {
    // A coluna Serviço pode mostrar a descrição ou só a chave da referência
    // (ex.: "238"). Nunca usar o ID do vínculo como ID do catálogo.
    const referencia = v.nome.trim();
    const referenciaNumerica = /^[1-9]\d*$/.test(referencia);
    const candidatos = catalogo.filter(r => r.Situacao === 'Ativo'
      && ((referenciaNumerica && String(r.Id) === referencia) || normal(r.Nome) === normal(referencia)));
    return {...v, pendente, registroMunicipal: candidatos.length === 1 ? candidatos[0] : null,
      identificadoPor: candidatos.length !== 1 ? null : referenciaNumerica && String(candidatos[0].Id) === referencia ? 'id_municipal' : 'descricao',
      identificacao: candidatos.length === 1 ? 'resolvida' : candidatos.length ? 'ambigua' : 'fora_do_catalogo'};
  };
  const vistos = new Set();
  const vinculos = captura.registros.map(v => {
    if (!idValido(v?.idVinculo) || typeof v.nome !== 'string' || !v.nome.trim() || vistos.has(String(v.idVinculo))) {
      throw Error('A captura possui vínculo inválido ou ID repetido.');
    }
    vistos.add(String(v.idVinculo));
    return resolver(v, false);
  });
  if (captura.vinculosPendentes != null && !Array.isArray(captura.vinculosPendentes)) throw Error('Lista de vínculos pendentes inválida.');
  const pendentes = (captura.vinculosPendentes ?? []).map(v => {
    if (!v || String(v.idVinculo) !== '0' || typeof v.nome !== 'string' || !v.nome.trim()) throw Error('Vínculo pendente inválido.');
    return resolver(v, true);
  });
  const todos = [...vinculos, ...pendentes];
  const servicos = plano.servicos.map(s => {
    const mesmoCodigo = todos.filter(v => v.registroMunicipal?.CodigoCompleto === s.codigo);
    const exatos = mesmoCodigo.filter(v => String(v.registroMunicipal.Id) === String(s.id) && v.registroMunicipal.Aliquota === s.aliquota);
    const situacao = mesmoCodigo.length === 1 && exatos.length === 1 ? (exatos[0].pendente ? 'preenchido_sem_salvar' : 'localizado')
      : mesmoCodigo.length ? 'conflito' : 'nao_localizado_na_captura';
    return {...s, situacao, idsVinculos: mesmoCodigo.map(v => v.idVinculo),
      formasIdentificacao: [...new Set(mesmoCodigo.map(v => v.identificadoPor))]};
  });
  return {
    tipo: 'comparacao_parcial_centi', versao: 1,
    empresa: {cnpj: normalizarCnpj(plano.empresa.cnpj), confirmacao: 'informada_pelo_operador'},
    servicos, vinculosSemIdentificacao: todos.filter(v => !v.registroMunicipal),
    vinculosPendentes: pendentes, totalVinculosPendentes: pendentes.length,
    totalVinculosVisiveis: vinculos.length, podePreencher: false, salvo: false,
    observacao: 'Não localizado nesta captura não significa ausente do cadastro. Datas, filtros, paginação e serviços herdados precisam de revisão; não houve preenchimento.'
  };
}
