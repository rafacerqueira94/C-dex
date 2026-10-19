# Ponte Centi — contexto recuperado

As seções abaixo preservam o histórico. A versão vigente e a próxima validação estão na seção Seleção automática confirmada, ao final deste documento.

Este documento foi reconstruído a partir dos arquivos recuperados e desta conversa. Não é o CONTEXTO.md original nem o palácio de memória mencionado pelo usuário; ambos continuam ausentes.

## Origem e preservação

- Aplicativo: extensão Chrome/Edge Ponte Centi, versão 0.7.2, Manifest V3.
- Recuperação: ZIP `PonteCenti-PDF-0.7.2-6b851b36.zip`, com 200 arquivos conferidos byte a byte.
- Repositório: https://github.com/rafacerqueira94/C-dex, branch `main`.
- Primeiro commit publicado: `c4c7217769342b7d12d1289489eefd1ca1c30c33`.
- O pacote não contém package.json, lockfile, scripts de build ou testes originais. Os comandos npm do LEIA-ME dependem de arquivos ainda não recuperados.

## Fluxo atual

1. Carregar a pasta da extensão sem compactação no Chrome/Edge e clicar no ícone para abrir o aplicativo.
2. Anexar cartão CNPJ PDF textual, até 10 MB e 20 páginas, e informar coworking.
3. Ler CNPJ, razão social, porte e CNAEs localmente usando PDF.js.
4. Sugerir serviços com as bases CNAE/ISS e catálogo municipal em `data/`.
5. Conferir os dados, selecionar serviços e baixar a lista em JSON.

O aplicativo ainda não preenche nem salva dados na Centi. Não há consulta externa por CNPJ ou OCR. O PDF não é incluído no JSON; são exportados seus metadados e SHA-256. O anexo permanece disponível apenas enquanto a aba estiver aberta.

## Regras implementadas

- Coworking: 2,00%; sem coworking e grande porte/DEMAIS: 5,00%; demais portes reconhecidos: 4,00%.
- Porte desconhecido exige classificação manual.
- CNAEs sem correspondência são destacados; não gerar vínculos por aproximação.
- Serviços ambíguos exigem escolha do registro municipal.
- A confirmação do operador é necessária para gerar a lista final.

## Organização

- `consulta.html`, `consulta.css`, `consulta.mjs`: interface e estado da conferência.
- `cartao-cnpj.mjs`: organização do texto e extração dos campos.
- `pdf.mjs`: leitura local de PDF, limites e identificação do documento.
- `dominio.mjs`: CNPJ/CNAE, alíquotas, correspondências e lista exportada.
- `worker.js`, `manifest.json`: abertura e configuração da extensão.
- `vendor/pdfjs/`: biblioteca, recursos e licenças incorporados.

## Continuidade

As verificações de integridade, sintaxe JavaScript, JSON, imports locais, validação de CNPJ, alíquotas e conversão/exportação com as bases recuperadas passaram. A validação completa no navegador deve ser registrada com os resultados observados, distinguindo documentos sintéticos de cartões reais.

O usuário definiu a próxima etapa: conectar a lista conferida ao preenchimento na Centi, identificando serviços já cadastrados para evitar duplicidades.

`conciliacao.mjs` implementa a comparação independente da tela: exige lista conferida, compara código completo, ID municipal e alíquota; separa já cadastrados, pendentes, conflitos e bloqueados. Leitura incompleta ou registros sem identificação bloqueiam o preenchimento. Divergências e duplicidades também bloqueiam a operação. Não executa ações na Centi e ainda não está ligado à interface. Nove testes passaram com `node --test tests/conciliacao.test.mjs`.

O usuário forneceu o manifesto do teste Centi 0.5.0, relatório de sucesso anterior e o PowerShell que transforma o worker 0.4.0 em 0.5.0. O destino recuperado é `https://ba.centi.com.br/caetite/`. O teste anterior informa pesquisa atualizada, seleção e campos conferidos, sem salvar. O worker completo ainda falta; o script depende dele. O mapa da lupa não inclui a lista de vínculos já cadastrados. Evidências, seletores e próximos passos estão em `docs/INTEGRACAO-CENTI.md`.

Antes de qualquer inclusão, o adaptador deverá verificar a empresa/CNPJ selecionado, ler todas as páginas da lista de vínculos, conferir os identificadores usados pela Centi e refazer a comparação para evitar incluir um serviço já inserido. Não presumir seletores não recuperados ou automatizar o salvamento sem definir o fluxo com o usuário.

A tentativa de validar a extensão no Chromium headless deste ambiente não iniciou o service worker, mesmo removendo o argumento padrão que desativa extensões. O fluxo PDF completo permanece não validado; isso não estabelece defeito no aplicativo. O roteiro temporário e o PDF sintético ficam fora do checkout, em `/workspace/validation-ponte/`.

Não presumir detalhes da interface Centi, suas regras municipais ou o conteúdo do palácio de memória ausente.

O usuário informou que o worker anterior não pôde ser recuperado. A decisão de continuidade é reconstruir a integração. Foi criada uma extensão separada em `tools/diagnostico-centi/` para gerar relatório estrutural da lista de serviços, sem dados de campos/células e sem ações na Centi. Cinco testes em DOM simulado passaram; a extensão e a tela real ainda precisam ser validadas pelo operador. Próxima entrada necessária: relatório gerado na tela dos serviços já vinculados, com a lupa fechada. A aplicação PDF permanece com seu manifesto original e o preenchimento ainda não está conectado.

O diagnóstico foi publicado no GitHub no commit `b8f9873` e executado pelo usuário. O JSON recebido, `diagnostico-centi-1792412253300.json`, mostra campos de formulário de serviço e uma lupa, mas nenhuma grade reconhecida, nenhum filtro ou iframe. A exportação pela extensão foi assim observada na máquina do usuário; a lista de vínculos ainda não foi identificada. Solicitar captura na relação dos serviços fora do formulário, sem descartar alterações pendentes. Ausência de grade reconhecida não comprova ausência de serviços cadastrados.

## Estado atual — 0.8.0

O relatório `diagnostico-centi-1792413452118.json` da ferramenta 0.2.0 reconheceu uma grade Wijmo com cabeçalhos repetidos (seleção, ID, Serviço, Data início, Data fim), sete linhas renderizadas de cinco células, dois painéis de dados e nenhum formulário/lupa/iframe. Isso não comprova sete vínculos distintos nem leitura completa.

A aplicação principal foi atualizada para 0.8.0 com activeTab e scripting. Ao clicar no ícone na Centi de Caetité, abre `integracao.html` com referência à aba de origem; fora da Centi continua abrindo o fluxo PDF. A nova tela importa a lista conferida, pede confirmação manual do CNPJ, lê a grade e compara com o catálogo, sempre sem escrita. `ler-vinculos-centi.mjs` valida domínio, formulário/lupa fechados e cabeçalhos; unifica apenas repetições idênticas do mesmo vínculo e rejeita dados divergentes. `comparar-captura.mjs` resolve descrições exatas normalizadas no catálogo, separa localizado/conflito/não localizado e destaca registros desconhecidos ou ambíguos. A leitura é sempre parcial, não verifica empresa automaticamente, não percorre paginação nem herança e nunca autoriza preenchimento (`podePreencher: false`).

Validação local: 21 testes Node de conciliação/comparação, três testes do worker, seis testes DOM do leitor e três testes UI com API Chrome simulada passaram (33 no total). Falta validar instalação e leitura 0.8.0 na máquina do usuário. Instruções em `docs/COMPARACAO-CENTI.md`. Instalar a pasta raiz do aplicativo, não a pasta da ferramenta de diagnóstico. O objetivo de preenchimento ainda não está concluído; o próximo passo depende da validação da leitura e identificação completa dos vínculos/empresa.

### Correção 0.8.1

O usuário abriu a comparação 0.8.0, mas selecionou um PDF no campo JSON e recebeu um erro técnico de JSON.parse. A versão 0.8.1 adiciona um link visível para gerar a lista a partir do PDF em outra aba, instruções do arquivo esperado e mensagens claras para PDF, JSON inválido e relatórios de outro tipo. A comparação original e a referência à aba Centi são preservadas. Seis testes UI passaram, incluindo três novos cenários de regressão; os demais módulos não foram alterados. A leitura da Centi real continua pendente de validação com uma lista válida.

### Primeira comparação real observada

O usuário enviou uma captura da comparação concluída na extensão 0.8.1 com a lista conferida válida: seis vínculos lidos; serviços 08.02.000, 13.02.000 e 17.06.000 localizados; 09.02.000 e 10.03.000 não localizados nessa captura; todos a 4%. O vínculo histórico (VETADO) continua sem correspondência no catálogo. A interface informa uma linha não interpretada. A causa dessa linha não foi identificada: não presumir que seja somente medição do Wijmo. Nenhum dado foi alterado na Centi. Isso valida instalação, leitura e comparação desse caso real, sem comprovar completude, vigência, herança, CNPJ automático ou preenchimento. Próxima entrada necessária: JSON exportado por Baixar comparação para analisar datas e metadados disponíveis antes de avançar à inclusão.

O segundo relatório, `diagnostico-centi-1792412718698.json`, identificou uma grade Wijmo do tipo lista, sem formulário aberto, porém sem cabeçalhos ou linhas reconhecidos. Foi criada a ferramenta 0.2.0 com seletores de classes Wijmo além de ARIA; sete testes DOM simulados passaram. Solicitar relatório dessa versão na mesma tela; não presumir lista vazia pelo relatório anterior. Captura da tela com dados privados ocultados é alternativa para esclarecer estrutura não reconhecida.

A captura enviada depois revela vínculos organizados em árvore à esquerda, sob Serviços, e formulário de detalhes à direita. A tela exibida é de inclusão pendente (Id 0, Serviço vazio, Salvar(1)). Há também Serviços herdados CNAE, que deve ser considerado no levantamento de regras de duplicidade. Priorizar mapeamento da árvore e de um vínculo já salvo, sem presumir que a grade encontrada seja a relação de serviços e sem descartar alterações pendentes do operador.

A captura seguinte confirmou que selecionar a pasta Serviços apresenta uma grade com ID de vínculo, Serviço, Data início e Data fim, com seis linhas visíveis. A árvore mostra códigos que permitem relacionar os vínculos ao catálogo. O código 13.01.000 (VETADO), a 4%, está vinculado no cadastro, mas não está no catálogo atual; os outros cinco resolvem unicamente. A conciliação agora possui `normalizarVinculosCenti`, que distingue ID de vínculo de ID municipal e bloqueia registros não resolvidos. Os 14 testes passaram. O leitor da tela Centi ainda precisa ser conectado; a captura não comprova completude do cadastro nem CNPJ selecionado. Para mapear as células do DOM, a ferramenta de diagnóstico publicada foi atualizada para 0.2.0, mas o usuário ainda não enviou seu relatório dessa versão.

## Progresso 0.9.0

O JSON real `comparacao-centi-1792415283471.json` confirmou seis vínculos, todos com Data início 18/11/2025 e Data fim vazia. O leitor não relatou repetições de renderização e descartou uma linha sem detalhar a causa; não presumir clone de medição ou lista completa. Três dos cinco serviços da lista estão localizados. Não localizados na captura: 09.02.000, ID municipal 238, e 10.03.000, ID municipal 51, ambos a 4%. Não inferir que o vínculo (VETADO) deva ser removido. O leitor agora inclui motivos estruturais das linhas não interpretadas em novos relatórios.

A versão 0.9.0 acrescenta pesquisa opcional em `pesquisar-servico-centi.mjs`, reconstruída do trecho 0.5.0 fornecido. A interface só oferece serviços não localizados, exige confirmação manual da empresa e ausência inclusive em herança/páginas/filtros e requer que o operador abra um vínculo novo, Id 0, Serviço vazio e lupa fechada. O script abre a lupa, define filtros de código/situação e pesquisa; só aceita resultado observado após atualização, único e exato por ID, código, nome e alíquota. Não seleciona a linha, não preenche serviço/datas e não salva. Recusa vínculo existente ou já preenchido. `ultimaPesquisa` é incluída em Baixar comparação. Falhas podem deixar lupa/filtros alterados; não tentar novamente sem conferir a tela.

Nesta etapa passaram sete testes UI com API Chrome simulada, seis testes DOM do leitor e cinco testes DOM da pesquisa, além dos testes anteriores de lógica/worker. A pesquisa 0.9.0 ainda não foi executada na Centi real. Próxima validação do operador: atualizar a extensão raiz, reutilizar a lista JSON existente, refazer comparação, escolher um dos dois códigos, conferir ausência, abrir vínculo novo e testar somente Abrir lupa e pesquisar. Instruções completas em docs/COMPARACAO-CENTI.md. O objetivo de preenchimento ainda não está concluído; seleção do serviço e conferência de campos serão as etapas seguintes após validar a pesquisa.

## Progresso 0.10.0

O JSON real `comparacao-centi-1792416949140.json` confirmou pesquisa do serviço 09.02.000, ID municipal 238, com resultado atualizado, único e exato: ok, pesquisa_conferida, selecionado false, salvo false. A linha descartada tem ID/descrição aparentando cabeçalho; o relatório não continha os demais títulos. O leitor agora ignora uma linha apenas quando todas as cinco células coincidem com o modelo dos cabeçalhos e conta esse caso separadamente. Correspondência parcial permanece sinalizada. Não presumir completude do cadastro.

O usuário confirmou que a seleção manual é feita com dois cliques na linha. A opção Pesquisar e selecionar — sem salvar foi implementada: reaproveita a pesquisa exata com atualização observada, reproduz os eventos de duplo clique e aguarda o retorno ao mesmo vínculo novo Id 0. Confere ID/código e descrição e verifica se as datas permaneceram iguais às lidas antes da seleção. Não altera datas, não verifica Especificar CNAE e não aciona Salvar. Se houver falha após acionar a seleção, o Serviço pode estar alterado; não há reversão. O resultado exportado distingue seleção acionada de seleção conferida e registra execução incerta em vez de reutilizar sucesso anterior.

Passaram oito testes DOM do leitor, nove testes DOM da pesquisa/seleção e nove testes UI com API Chrome simulada. A pesquisa 0.9.0 está validada na Centi real; a seleção 0.10.0 ainda depende do operador. Próximo teste: atualizar a pasta raiz, refazer comparação com o JSON existente, fechar a lupa anterior mantendo vínculo novo vazio, escolher o serviço, confirmar a ausência e usar Pesquisar e selecionar. Conferir a tela e exportar comparação sem salvar o vínculo. Instruções em docs/COMPARACAO-CENTI.md.

## Correção 0.10.1

O primeiro teste 0.10.0 parou sem interação por ausência de um único formulário novo visível. O teste seguinte chegou a conferir_servico, mas expirou após duplo clique sem confirmar o Serviço. Os JSONs seguintes repetiam o mesmo resultado. A captura posterior mostrou lupa aberta com três alíquotas: primeira linha ID 740 / 5% destacada, segunda 494 / 2%, terceira e esperada 238 / 4%. Não concluir que o serviço errado foi preenchido/salvo: nada foi confirmado e Salvar não foi acionado.

A versão 0.10.1 trata a hipótese de que os eventos sintéticos não alteraram a seleção interna do Wijmo. A opção de seleção agora é injetada em MAIN para usar a API pública wijmo.Control.getControl; encontra uma única linha por colunas ID/código/nome/alíquota, usa select e verifica a seleção antes do duplo clique. Não usa propriedades privadas. Sem API ou seleção confirmada, não dá duplo clique. A conferência do formulário, Id 0 e datas preservadas continua obrigatória. Em timeout, exporta os campos observados e quantas lupas permanecem abertas; não reutiliza sucesso anterior.

Passaram 12 testes DOM da pesquisa/seleção e nove UI simulados, incluindo o cenário de três alíquotas com a correta na terceira linha. A API Wijmo nesses testes é simulada; a disponibilidade dela na Centi e o fechamento real da lupa ainda não foram verificados. Próximo teste do operador: atualizar raiz para 0.10.1, fechar lupa anterior, refazer comparação na pasta Serviços, reabrir o vínculo novo vazio, confirmar ausência e usar Pesquisar e selecionar. Exportar comparação sem salvar.

## Ativação e conferência 0.10.2

O relatório real comparacao-centi-1792419418894.json confirmou API Wijmo disponível, linha 2/ID 238/4% selecionada e conferida. Porém a lupa continuou aberta e Serviço/descrição permaneceram vazios; datas 19/10/2026 e fim vazio. Isso valida a seleção na grade, mas não a ativação/retorno ao formulário. Não declarar seleção automática concluída. A tentativa de consultar scripts públicos da Centi a partir da máquina cloud recebeu bloqueio 403 do túnel; não foram obtidos scripts nem solicitadas credenciais.

A versão 0.10.2 tenta a sequência completa de cliques no elemento sob o centro da célula (incluindo filhos), mantendo a pré-seleção pela API. Interrompe eventos se a lupa fechar ou se a seleção mudar. Exporta alvo/eventos e datas anteriores. A ativação real ainda não foi validada.

Foi adicionado Conferir seleção manual — sem salvar. Após o operador escolher a linha exata por duplo clique, esse modo lê o mesmo vínculo novo Id 0 e compara ID/código/descrição com o serviço esperado. Não clica, não pesquisa, não escreve campos e não salva. Registra origemSelecao operador; não atribuir esse resultado à automação. Confere preservação de datas apenas se houver registro anterior da mesma tentativa, senão retorna null. Recusa serviço errado ou lupa aberta. A opção usa a confirmação da empresa da comparação, sem exigir declaração incompatível de Serviço vazio.

Passaram 16 testes DOM e 10 UI simulados nesta etapa, inclusive alvo interno com dois cliques, conferência manual sem mutações e datas. Falta validação real das novas rotas. Próximo teste: atualizar raiz para 0.10.2, refazer comparação na pasta Serviços e manter o código 09.02.000 selecionado. Pesquisar na lupa, escolher manualmente a linha 238 / 4% se a ativação automática não fechar a lupa, voltar ao Ponte Centi e usar Conferir seleção manual. Exportar resultado sem salvar. O objetivo de automatizar completamente a ativação e o preenchimento continua pendente; não tratar a conferência manual como solução definitiva dessa parte.

## Seleção automática confirmada — 0.10.2 / mensagem 0.10.3

O JSON real comparacao-centi-1792419986717.json confirmou ok true, etapa servico_conferido, selecionado true, selecaoAcionada true, datasPreservadas true e salvo false. Serviço 09.02.000, ID municipal 238, devolvido ao formulário como código 09.02.000 e descrição de 4%. Id do vínculo permanece 0. Data início 19/10/2026 e data fim vazia. A origem é automática: API Wijmo selecionou a terceira linha e a sequência pointerdown/mousedown/pointerup/mouseup/click fechou a lupa. Não houve dblclick nem uso do modo manual. A mensagem antiga mencionava duplo clique incorretamente.

A versão 0.10.3 corrige somente a mensagem de sucesso e adiciona metodoAtivacao, inferido dos eventos efetivamente enviados. Passaram os 17 testes DOM de pesquisa/seleção/conferência, incluindo o fechamento no primeiro clique e ausência de eventos adicionais. O usuário não precisa repetir a seleção ou atualizar para validar o mesmo caso já concluído.

O objetivo de ativação automática do serviço foi validado para 09.02.000/238 na Centi real. O vínculo segue sem salvar, como solicitado para os testes. Ainda falta conferir Especificar CNAE e os demais dados do formulário antes de discutir salvamento. Próxima entrada: captura do formulário preenchido (não da lupa), para conferir o campo Especificar CNAE. Não repetir pesquisa no vínculo preenchido, não criar outro vínculo 09.02.000 e não iniciar o segundo serviço antes de resolver o primeiro pendente. Não afirmar que a seleção 10.03.000 foi testada; ela não foi.
