// Passagem temporária na mesma aba da extensão; não guarda o PDF.
export function guardarPlanoDaAba(storage, plano, aba, agora = Date.now()) {
  if (!Number.isSafeInteger(aba) || aba <= 0) throw Error('Abra a extensão pelo ícone na aba da Centi para continuar o cadastro.');
  if (plano?.tipo !== 'lista_servicos_conferida' || plano.conferidoPeloOperador !== true) throw Error('Confira os serviços do PDF antes de continuar.');
  storage.setItem('ponte-centi-fluxo-pdf', JSON.stringify({plano, aba, criadoEm: agora}));
}
export function receberPlanoDaAba(storage, aba, agora = Date.now()) {
  const valor = storage.getItem('ponte-centi-fluxo-pdf');
  storage.removeItem('ponte-centi-fluxo-pdf');
  if (!valor) throw Error('Importe novamente o cartão CNPJ para iniciar o cadastro.');
  const dados = JSON.parse(valor);
  if (dados.aba !== aba || !Number.isFinite(dados.criadoEm) || agora < dados.criadoEm || agora - dados.criadoEm > 30 * 60 * 1000) throw Error('A sessão do cartão expirou ou pertence a outra aba. Importe o PDF novamente.');
  if (dados.plano?.tipo !== 'lista_servicos_conferida' || dados.plano.conferidoPeloOperador !== true) throw Error('Confira novamente os serviços do PDF.');
  return dados.plano;
}
