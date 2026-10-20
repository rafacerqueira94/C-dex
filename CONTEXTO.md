# Ponte Centi — contexto recuperado

Para recuperação rápida e cópias de segurança, leia **RETOMAR.md**. O marco desta recuperação é a tag **progresso-2026-10-19** e a cópia completa fica na branch **backup/progresso-2026-10-19**.

As seções abaixo preservam o histórico. A versão do código é 0.11.2; o caso de teste está concluído na seção Validação final dos cinco serviços, ao final deste documento.

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

## Proteção de pendências 0.11.0

A captura final enviada pelo usuário confirmou o formulário preenchido com 09.02.000, início 19/10/2026, fim vazio e Especificar CNAE = Não. Id 0 e Salvar(1) confirmam que o vínculo ainda está pendente. A confirmação de Especificar CNAE é visual e específica dessa captura, não automática pelo programa. O preenchimento assistido desse serviço foi validado sem persistência.

Foi acrescentado reconhecimento de linhas renderizadas com Id 0 e descrição em `vinculosPendentes`. A comparação resolve as descrições pelo catálogo e classifica um serviço único assim encontrado como preenchido_sem_salvar, excluindo-o das opções de nova inclusão. Vínculo existente mais novo ou dois novos para o mesmo código geram conflito. Não unificar ID 0 por conteúdo igual, pois pode haver duplicidade real. Pendência sem correspondência permanece destacada; leitura sempre parcial, podePreencher false. Não prometer detecção de pendências fora da grade ou sem dados reconhecíveis.

Passaram 11 testes Node da comparação, nove DOM do leitor e 11 UI simulados nesta etapa (31). Falta observar a leitura real de pendências 0.11.0 e a confirmação de persistência de qualquer vínculo. O programa não salva. Para efetivar um cadastro, o operador decide e usa Salvar na Centi; só considerar salvo após ID definitivo ou confirmação e releitura da lista. Próximo teste de deduplicação após eventual salvamento manual: reler Serviços com o mesmo JSON, confirmar 09.02.000 localizado e não oferecido novamente; 10.03.000 continua não testado. Não pedir para repetir a seleção 09.02.000 nem iniciar o segundo enquanto o primeiro estiver pendente.

## Referência numérica 0.11.1

O usuário enviou comparacao-centi-1792421312126.json após o passo de salvamento manual/releitura. A captura tem sete vínculos e um novo ID definitivo 16192, data início 19/10/2026, fim vazio, Serviço exibido como "238". Isso é a referência ao catálogo municipal 238/09.02.000/4%, não o ID de vínculo. O comparador antigo só aceitava a descrição e deixou esse serviço como não localizado. A tentativa adicional registrada na mesma exportação parou antes de qualquer interação por ausência de formulário novo. Não recomendar repetir a inclusão de 09.02.000.

A versão 0.11.1 resolve o texto numérico positivo da coluna Serviço pelo ID exato do catálogo ativo, sem usar idVinculo. Se houver ambiguidade, desconhecimento ou só um código sem alíquota, não aproxima. Também trata referência numérica em pendente Id 0 como preenchido_sem_salvar. Exporta formasIdentificacao/identificadoPor. O campo salvo=false no relatório significa que a extensão não acionou Salvar, não que não houve salvamento manual pelo operador.

Foram reprocessados localmente o JSON real e a lista conferida original: 09.02.000 localizado no vínculo 16192; 08.02.000, 13.02.000 e 17.06.000 localizados; somente 10.03.000 não localizado na captura. O (VETADO) permanece sem correspondência. Não houve operação na Centi nesse reprocessamento. Passaram 16 testes Node da comparação e 12 UI simulados. Falta executar a comparação corrigida na extensão real para validar a retirada de 09.02.000 das opções; o dado real já reproduziu a correção localmente. Próximo passo: atualizar raiz 0.11.1, refazer apenas comparação, nunca recadastrar 09.02.000; preparar 10.03.000/ID 51/4% somente após conferir ausência inclusive herança/paginação/filtros e abrir vínculo novo vazio. Não afirmar que o segundo serviço já foi selecionado ou salvo.


## Validação real da comparação 0.11.1

O JSON comparacao-centi-1792421644811.json confirmou sete vínculos com ID, zero pendentes renderizados e zero linhas não interpretadas. 09.02.000 foi localizado no vínculo 16192 por id_municipal. Os outros três serviços anteriores continuam localizados. Apenas 10.03.000, ID municipal 51, alíquota 4%, está não localizado na captura. A correção de referência numérica está validada na extensão real; não pedir para repetir 09.02.000.

O mesmo relatório contém uma tentativa de preparar 10.03.000 interrompida em conferir_formulario, sem interação, pesquisa, seleção ou salvamento: não havia exatamente um formulário novo visível. Não é uma falha da busca. Próximo passo operacional: na Centi, confirmar ausência de 10.03.000 também em herança/páginas/filtros, selecionar Serviços e abrir um vínculo novo vazio Id 0, lupa fechada. Na aba de comparação existente, escolher 10.03.000, confirmar e usar Pesquisar e selecionar sem salvar. Pedir o relatório após essa seleção; não é necessário atualizar a extensão ou gerar nova lista JSON agora.

## Erro de leitura 0.11.2

O usuário enviou uma captura da tela Ponte Centi 0.11.1 com a mensagem A aba da Centi não retornou a leitura. A imagem não mostra o estado da aba Centi; não concluir que o formulário estava aberto ou que a permissão expirou. O código antigo lançava erros internos do leitor sem serializar seu motivo para a interface. Foi adicionado retorno erro_leitura_centi e tratamento explícito para mostrar o motivo em português. A tela também esclarece: comparar primeiro na tabela da pasta Serviços, abrir vínculo novo somente depois para pesquisa/seleção. Passaram nove testes DOM e 13 UI simulados.

Para retomar sem exigir atualização só para a navegação: voltar à Centi, clicar na pasta Serviços (não no vínculo filho) e deixar a tabela visível/lupa fechada, preservando alterações pendentes. Clicar no ícone da extensão a partir dessa aba para abrir uma comparação nova, importar o JSON já existente e comparar. Depois abrir vínculo novo e usar a comparação pronta para 10.03.000. Se a falha persistir, a 0.11.2 permite obter o motivo interno; falha de navegador/aba sem retorno continua pedindo reabertura pelo ícone. Não repetir inclusão 09.02.000, já localizado no vínculo 16192.


## Segundo serviço selecionado automaticamente — 10.03.000

O JSON real comparacao-centi-1792426021171.json confirmou ok true, etapa servico_conferido, método clique, selecionado true e salvo false para 10.03.000, ID municipal 51, 4%. A API Wijmo confirmou a terceira linha e o primeiro clique fechou a lupa. O formulário retornou código 10.03.000 e descrição correta, com Id do vínculo 0, início 19/10/2026 e fim vazio, datas preservadas. Não foi conferência manual. O vínculo ainda não foi salvo.

A comparação contida nesse mesmo JSON é anterior à seleção: sete vínculos com ID, zero pendentes naquela captura e quatro serviços localizados, incluindo 09.02.000 no vínculo 16192. Não interpretar o estado nao_localizado de 10.03.000 nessa captura antiga como falha da seleção bem-sucedida que ocorreu depois. Não pedir para repetir a seleção ou abrir outro vínculo 10.03.000.

Próximo passo: operador conferir Especificar CNAE = Não no formulário atual e demais dados. Se decidir efetivar o vínculo, salvar manualmente na Centi. Depois voltar à pasta Serviços e refazer somente a comparação com o mesmo JSON; esperar os cinco serviços da lista localizados, sem oferta de nova inclusão. Ainda falta observar esse salvamento/ID definitivo do segundo vínculo e a comparação final. Não afirmar que a extensão salvou ou que o caso completo já foi concluído.


## Validação final dos cinco serviços — caso concluído

O relatório real comparacao-centi-1792426509098.json confirmou todos os cinco serviços da lista selecionada como localizados: 08.02.000 (vínculo 12126), 09.02.000 (16192), 10.03.000 (16198), 13.02.000 (7403) e 17.06.000 (2592). São oito vínculos com ID renderizados, zero pendentes identificados, zero linhas não interpretadas e nenhuma ultimaPesquisa nessa releitura. O segundo serviço já aparece com ID definitivo após o salvamento manual/releitura; não pedir para selecioná-lo ou salvá-lo novamente.

O caso de teste de comparação, seleção assistida dos dois serviços inicialmente não localizados, salvamento pelo operador e reconhecimento dos vínculos na releitura foi concluído. Como os cinco serviços estão localizados, nenhum deve aparecer nas opções de nova inclusão para essa lista. A automação não acionou Salvar; não atribuir a persistência ao programa.

Permanece um vínculo histórico (VETADO), ID 3601, sem correspondência no catálogo atual e separado para revisão; o programa não o alterou. A lista original tinha listaPossivelmenteIncompleta true, portanto conclusão dos cinco selecionados não significa cobertura completa de todos os CNAEs ou ausência de registros fora da captura. Paginação, filtros, herança, vigência e empresa continuam com as limitações documentadas. A leitura/conferência automática de Especificar CNAE e o salvamento automático não foram implementados. Não afirmar validação de generalização para todos os cadastros. Nenhuma nova instalação, repetição dos testes de inclusão ou ação no cadastro é necessária para concluir este caso.


## Retomada para conclusão — 0.12.0 (20/10/2026)

O usuário pediu avançar para terminar o aplicativo. Foi apresentada a escolha entre concluir a versão assistida e automatizar também o salvamento; na ausência de definição, mantém-se salvamento manual. O caso real concluído não foi repetido e não houve operação na Centi. A interface agora resume serviços localizados, pendentes, conflitos e não localizados e informa quando todos os selecionados foram localizados, sem afirmar completude do cadastro ou vigência. LEIA-ME.txt foi reescrito como roteiro atual, separando pesquisa, seleção, revisão manual, salvamento e releitura. O início de INTEGRACAO-CENTI.md agora registra a conclusão real e identifica o restante como histórico. Corrigidas referências da interface que atribuíam toda ativação a duplo clique.

Antes dessa mudança passaram 33 testes Node, nove DOM do leitor, 17 DOM da pesquisa/seleção e 13 UI simulados. Ainda não foram implementados salvamento automático, leitura automática de Especificar CNAE, navegação completa de páginas/herança ou identificação automática da empresa. A versão 0.12.0 não altera a pesquisa/seleção validada. O marco progresso-2026-10-19 permanece intacto como recuperação 0.11.2.

O usuário escolheu explicitamente automatizar também o salvamento. A 0.12.0 agora oferece Salvar vínculo na Centi após seleção conferida e revisão da única alteração pendente. salvar-servico-centi.mjs verifica Id 0, Serviço, datas, um único EspecificarCnae+sufixo como Não e um único Salvar(1) visível, habilitado e descoberto. Aciona uma vez e só declara salvo=true após observar ID definitivo no mesmo formulário. Requer releitura da tabela. Falha antes do clique retorna false; falha depois ou ausência de retorno retorna null e bloqueia repetição nessa seleção. Exporta ultimoSalvamento. A confirmação de ausência de outras alterações continua manual: o botão é do cadastro e não há API documentada para inspecionar todas as pendências.

Não há evidência do ID DOM real de Especificar CNAE nos diagnósticos antigos. O seletor é conservador e bloqueia se não existir exatamente EspecificarCnae+sufixo; não considerar a automação real concluída. Próximo passo é validar em um novo caso legítimo, sem repetir inclusões já concluídas, e obter a comparação exportada. Caso bloqueie na identificação de CNAE/Salvar, mapear o DOM do formulário antes de ampliar seletores. Não tentar adivinhar outro botão ou salvar em lote.

Verificação da retomada: 33 testes Node, nove DOM do leitor, 17 DOM da pesquisa/seleção, seis DOM novos do salvamento e 14 UI simulados passaram (79 no total). O teste UI cobre liberação após seleção/revisão, exportação do ID definitivo e resultado incerto, além de bloquear nova tentativa. Foi corrigida a geração de identificador da tentativa para usar crypto.getRandomValues, disponível também no contexto HTTP dos testes; os dados do formulário não são enviados a outro serviço. Nenhum salvamento real foi executado nesta etapa.


## Correção do fluxo de produto — 0.13.0 (20/10/2026)

O usuário explicou que a finalidade é importar o cartão CNPJ da Receita da empresa atual, filtrar os serviços e adicionar/salvar na Centi. A captura mostrava lista JSON da empresa anterior com CNPJ diferente; o bloqueio foi correto, mas exportar/importar JSON era um roteiro de teste que não atendia ao fluxo desejado. Não orientar o usuário a trocar apenas o CNPJ da lista antiga. A entrada padrão foi corrigida: o ícone na Centi abre consulta.html?aba=ID com o PDF. Após conferir a lista, Continuar para cadastrar na Centi passa o plano na mesma aba por sessionStorage (vinculado à aba, 30 minutos, uso único). Não guarda PDF nem exige JSON intermediário. CNPJ é preenchido do PDF e protegido para edição na integração. Fora da Centi, a consulta continua sem aba conectada e orienta abrir pelo ícone na Centi.

Foi implementada fila cadastrar-servicos.mjs: compara novamente, ignora os localizados, bloqueia pendências/conflitos/linhas não interpretadas, abre Novo por navegar-servicos-centi.mjs, usa pesquisa/seleção validada, verifica datas de hoje em São Paulo e fim vazio, chama salvamento com Especificar CNAE = Não, observa ID definitivo, volta à pasta Serviços e exige vínculo localizado com o mesmo ID antes do próximo. Falha interrompe a fila, exporta ultimoCadastro com código/etapas/última captura e não repete salvamento incerto. A UI bloqueia controles durante a execução e exige nova comparação antes de permitir reinício. O campo CNAE também pode ser identificado por label/for explícito; ambiguidades bloqueiam. Novo e Serviços exigem controles visíveis únicos, sem pendências antes de sair/abrir formulário. Não há prova de generalização da estrutura DOM da Centi; esses controles novos ainda precisam de validação real. A confirmação de empresa, ausência fora da captura e outras alterações continua manual; não chamar de leitura completa. A seleção e o salvamento anteriores individuais continuam disponíveis no modo avançado por JSON, mas ficam fora do caminho padrão do PDF.

A nova versão não executou operações na Centi real nem repetiu o caso concluído. O teste de fluxo usa PDF real sintético extraído com PDF.js e ações Chrome simuladas; isso comprova a ligação das telas e orquestração, não a persistência real. Próximo teste: novo caso legítimo, com cartão PDF correto da empresa aberta na Centi. Se houver bloqueio de controle, obter Baixar comparação para identificar a etapa antes de ampliar seletores.

Verificação 0.13.0: passaram 42 testes Node (incluindo nove da fila/passagem do PDF), nove DOM do leitor, 17 DOM da pesquisa/seleção, oito DOM do salvamento, quatro DOM de navegação, 14 UI da integração e um teste completo de navegador PDF→cadastro (95 no total). O teste completo confirma PDF.js com PDF sintético real, CNPJ automático protegido, ausência de importação JSON, uma chamada de salvamento, retorno à lista e relatório com serviço localizado. Os testes de fila verificam ignorar existentes, interrupção por conflitos/pendências, preservação de resultado incerto, conferência da data e releitura antes de outro item. Nenhuma dessas verificações executa persistência na Centi real.


## Bloqueio real em Especificar CNAE — 0.13.1 (20/10/2026)

A captura do usuário mostrou o fluxo 0.13.0 interrompido em salvar: Especificar CNAE não identificado de forma única, com nenhum botão Salvar acionado. A última comparação tinha nove vínculos, 07.03.000 localizado e 07.02.000 não localizado. O vínculo de 07.02.000 pode permanecer preenchido e pendente após a seleção; não abrir outro nem refazer a pesquisa. A imagem não revela o DOM do campo, portanto não atribuir sua estrutura exata a evidência real.

O resolvedor 0.13.1 aceita título exato em div/span/td, associação aria-labelledby ou o menor grupo visual com um único select e sem outros inputs/textarea. Não atravessa o formulário do Serviço nem aceita grupos com múltiplos controles. Mantém opção Não, unicidade e demais verificações antes de salvar. Falhas agora exportam diagnosticoCnae (identificadores limitados e categorias Sim/Não/outra, sem ler dados livres da empresa). Essa ampliação é testada em DOM simulado e ainda precisa de validação real; se falhar, solicitar Baixar comparação para mapear com evidência.

Foi adicionada retomada do vínculo já preenchido no fluxo PDF, sem leitura obrigatória da tabela antes: importar o mesmo cartão/selecionar mesmos serviços, conferir empresa e única pendência, usar Conferir vínculo preenchido para salvar. A ação usa apenas a conferência somente-leitura já implementada, cruza a lista com o catálogo, exige um único Serviço correspondente/Id 0 e apresenta a seção Salvar. Não abre Novo, não pesquisa e não modifica campos. O salvamento continua uma ação explícita após revisão; depois releitura da tabela. Não usar para repetir tentativa de resultado incerto.

Verificação 0.13.1: passaram 11 testes DOM de salvamento, 14 UI de integração e dois de fluxo PDF (27 afetados). Os novos testes cobrem campo com título em div sem label/for, grupo ambíguo, select não relacionado e retomada com apenas conferência/salvamento, sem Novo/pesquisa. Nenhuma ação foi executada na Centi real nesta correção.


## Entrada autônoma e navegação da empresa — 0.14.0 (20/10/2026)

O usuário esclareceu que o programa deve iniciar com a Centi fechada, solicitar no máximo login/acesso e executar o restante. Ele forneceu o percurso visual: Arrecadação → Atividade econômica (menu) → Atividade econômica AR022 em Cadastros → preencher CPF/CNPJ e pesquisar → duplo clique na linha do CNPJ → Serviços na árvore esquerda → conferir existência → Novo. A captura AR022 primeiro mostrava nenhum resultado; a seguinte confirmou uma linha com CNPJ exato. Não criar empresa ou aproximar por nome quando pesquisa não encontrar o CNPJ.

conectar-centi.mjs abre a Centi se fechada ou reutiliza aba única/vinculada; em várias abas sem vínculo, abre dedicada para não escolher cadastro arbitrário. A lista PDF pode atravessar telas sem aba Centi prévia (aba null), preservada enquanto usuário faz login. Requer host_permissions https://ba.centi.com.br/caetite/*, pois activeTab não cobre essa entrada. Não lê nem escreve senhas. O inspector só devolve metadados/rotulos conhecidos, nunca valores de inputs. Polling de login faz somente leituras; a localização da empresa é acionada uma vez após tela conhecida. Em bloqueio, oferece mapa-conexao-centi.json.

pesquisar-empresa-centi.mjs navega pelos controles exatos, pesquisa com CPF/CNPJ/Contendo e CNPJ formatado, limpa somente filtros textuais conhecidos de razão/nome fantasia, observa atualização da grade e exige uma linha exata. abrir-empresa-centi.mjs usa a API pública Wijmo para selecionar pelo CNPJ e ID, ativa a linha e verifica Atividade econômica - ID no cadastro. Só então navega Serviços e marca conferência automática da empresa. Após comparar, o plano autorizado no botão Iniciar cadastro automático dispara a fila já existente. O usuário não precisa preparar a tabela ou clicar manualmente em Novo na entrada normal. Outras pendências e ambiguidade bloqueiam sem descarte. No modo avançado, ainda há controles manuais e retomada.

Os novos seletores e interações são conservadores e testados em DOM simulado; as imagens não fornecem DOM suficiente para garantir compatibilidade real. Não afirmar sucesso real da navegação/salvamento. A leitura de vínculos segue parcial quanto a páginas, filtros e herança; a versão não implementa enumeração completa nem promete eliminação de duplicidades fora da captura. A autorização do botão é para os serviços selecionados ainda não localizados nesta leitura, sem declarar que o operador conferiu todas as páginas/heranças. A Centi precisa existir durante as operações; abertura inicial é automática, fechamento durante mutação gera parada/conferência, não repetição cega.

Verificação 0.14.0: passaram 46 testes Node, cinco DOM de pesquisa/abertura de empresa, quatro de fluxo PDF (incluindo Centi fechada/login/continuação automática), 14 UI de integração, nove DOM do leitor de vínculos, 17 da pesquisa/seleção, 11 do salvamento e quatro de navegação (110 no total). A UI esconde a preparação manual de tela no fluxo PDF e coloca retomada em opções separadas. Não houve nenhuma operação no cadastro Centi real nesta implementação.


## Mapa de conexão e cartão AR022 — 0.14.1 (20/10/2026)

O usuário enviou mapa-conexao-centi.json v1: tela_disponivel, rótulos CONTRIBUINTE/ATIVIDADE ECONOMICA/AR022, possuiFiltros false, possuiFormularioServico false, inputs sem IDs e react-select-2-input readonly. Isso não identifica o DOM clicável nem comprova exatamente em qual etapa parou. A exportação 0.14.0 reutilizava a leitura inicial: o mapa podia estar desatualizado após a falha de navegação. Não concluir autenticação, pesquisa ou abertura da empresa a partir desses rótulos.

O resolvedor de AR022 foi ampliado para cartão em div/li com listener delegado, sem atributo onclick/href/role. Exige texto exato Atividade econômica + AR022 (+ indicador VIDEO opcional), escolhe o menor grupo e preserva unicidade; não clica em um contêiner amplo de funcionalidades. O mapa v2 registra ancestrais estruturais dos títulos (tags/classes/roles/indicação de handler) sem copiar texto livre, e o download agora injeta uma nova leitura no momento do clique, incluindo horário e falhaLocalizacao (função/etapa/mensagem). Falha de transporte também registra a função. O ajuste ainda precisa de teste na Centi real; se persistir, pedir o novo mapa após o bloqueio, não adivinhar outro controle.

Verificação 0.14.1: seis testes DOM de pesquisa/abertura da empresa, cinco de fluxo PDF/conexão (incluindo download atualizado após erro) e 14 UI de integração passaram (25 afetados). O teste de mapa comprova nova leitura após alteração da tela e inclusão da função/etapa com falha. Não houve ação na Centi real.


## Submenu real sidebarSubItens — 0.14.2 (20/10/2026)

O novo mapa v2 registrou falhaLocalizacao pesquisarEmpresaCenti / abrir_pesquisa: O menu Arrecadação não foi identificado de forma única. Seu alvo ATIVIDADE ECONOMICA é um span dentro de div.sidebarSubItens, sem onclick ou role; não havia filtros/formulário de serviço. O seletor ignorava esse submenu visível e procurava Arrecadação desnecessariamente. Adicionado div.sidebarSubItens à lista de controles elegíveis, mantendo rótulo exato, visibilidade, unicidade e verificação do alvo do clique. O teste reproduz o div real com span e clique delegado, remove Arrecadação e verifica sequência direta economia→AR022→pesquisar. Não houve teste na Centi real nesta correção.

Verificação 0.14.2: passaram sete testes DOM de pesquisa/abertura de empresa, cinco de fluxo PDF e 14 UI de integração (26 afetados). O caso novo reproduz a estrutura recebida no mapa, sem usar dados privados da empresa.


## Confirmação da lista Serviços — 0.14.3 (20/10/2026)

O mapa v2 seguinte registrou falhaLocalizacao navegarServicosCenti, sem_retorno, mensagem A navegação não retornou a tela esperada. A navegação chegou à árvore Serviços: span em div.divTreeSelected, dentro de div.rowTree.normalRowTree.row, pai open.folderClass. Não há IdServico visível nem filtros, e há Novo/Salvar e nove checkboxes na lista. Pela sequência do código, a pesquisa/abertura da empresa retornaram sucesso antes dessa etapa; o mapa isolado não traz cabeçalhos da grade nem prova persistência. Não pedir repetir clique em Novo ou salvar manualmente para diagnosticar essa etapa.

A navegação agora aciona o div.divTreeSelected específico observado em vez do span e filtra visibilidade dos cabeçalhos igual ao leitor de vínculos, evitando tornar uma grade com template oculto compatível. Não flexibiliza a exigência de uma única grade com ID/Serviço/datas nem cria vínculos sem confirmar a lista. Falhas agora retornam etapa aguardar_lista_servicos/aguardar_formulario_servico e diagnosticoNavegacao com contagem de formulários e grades/cabeçalhos conhecidos/linhas, copiado para falhaLocalizacao. Mapa v3 também coleta estrutura de grades Wijmo/aria/table, sem dados das células. Essas mudanças testam hipóteses do bloqueio e melhoram evidência; não afirmar resolução real sem novo resultado.

Verificação 0.14.3: passaram seis testes DOM de navegação, sete da pesquisa/abertura de empresa, cinco de fluxo PDF e 14 UI (32 afetados). Casos novos cobrem divTreeSelected com clique delegado e grade com cabeçalho oculto que não deve contar como outra lista. Nenhuma interação na Centi real foi executada nesta correção.


## Colunas virtualizadas de Serviços — 0.14.4 (20/10/2026)

O mapa v3 mostrou divergência temporal concreta: no momento da falha aguardar_lista_servicos havia uma grade e dez linhas no DOM, mas só ID e Serviço entre os cabeçalhos renderizados; ao baixar depois, a mesma grade (wj-control/wj-content/wj-flexgrid/wj-state-empty/tableSearch/gridCollectionTotal) tinha seleção/ID/Serviço/Data início/Data fim, repetidos para medição. Isso explica gradesCompativeis=0 durante a espera; não era prova de lista ausente. O nó Serviços estava selecionado e não havia formulário visível.

A 0.14.4 executa navegação/leitura de vínculos em MAIN para acessar a API pública Wijmo. A confirmação da grade aceita as quatro colunas únicas da API mesmo se datas não estiverem renderizadas. O leitor obtém ID/Serviço/datas por getCellData formatado e percorre as linhas públicas da grade, sem usar propriedades privadas, selecionar, rolar ou clicar. Se não há API mapeada, mantém o leitor DOM anterior. Não inventa datas quando uma coluna falta; recusa identificação ambígua e IDs divergentes como antes. Exporta origemLeitura api_publica_wijmo/dom e mantém leituraCompleta false: dados fora da página/coleção, filtros e herança não foram percorridos. Não confundir linha API com linha fisicamente renderizada ou prometer completude. Limite de dez mil linhas bloqueia leitura não conferível.

Mapa v4 inclui disponibilidade, nomes conhecidos das colunas e quantidade de linhas da API, sem valores. Isso permite distinguir API indisponível de colunas ausentes caso persista falha. Não houve teste na Centi real nessa correção; o teste novo reproduz os cabeçalhos parciais e usa API pública simulada.

Verificação 0.14.4: passaram 12 testes DOM/API do leitor, sete de navegação, cinco de fluxo PDF, 14 UI e sete de pesquisa/abertura de empresa (45 afetados). Os novos casos cobrem datas virtualizadas, pendência Id 0 via API, coluna de data ausente e IDs divergentes, sem seleção ou cliques na leitura.


## Salvamento bloqueado por hit-test — 0.14.5 (20/10/2026)

O usuário enviou mapa v4 e captura 0.14.4. O fluxo chegou à seleção/salvamento: a tela informa O botão Salvar está coberto, Nenhum botão Salvar foi acionado. O mapa tem formulário de Serviço visível, sem grades, falhaLocalizacao null, Salvar com pendências habilitado. IDs reais: Id/IdServico/DataInicio/DataFim têm sufixo GUID sem hífens; o botão btnFooterSalvar usa GUID com hífens; EspecificarCNAE está em maiúsculas. O mapa não identifica o elemento cobrindo Salvar naquele instante: transição da lupa ou geometria em aba oculta são hipóteses, não fatos provados. Não recriar o vínculo 07.02.000 já preenchido para retestar.

A função agora aceita o ID real EspecificarCNAE e valida, quando houver btnFooterSalvar, a correspondência normalizada do sufixo com o formulário. Usa scrollIntoView nearest/instant e aguarda até três segundos pela geometria/hit-test livre, reconferindo serviço/datas/Id 0 e botão a cada tentativa, sem enviar cliques na espera. Bloqueio persistente em aba visível continua sem salvar. Se a aba estiver oculta e não permitir conferência, retorna ativacaoNecessaria true, salvo false e salvamentoAcionado false. A interface só nessa combinação ativa a aba Centi e repete a conferência com a mesma tentativa; após conclusão/falha restaura a aba do aplicativo quando ainda existe. Nunca ativa/reenvia após resultado incerto ou clique acionado. Cobertura real não é ignorada.

Falhas incluem diagnosticoSalvar (visibilidade, posição no viewport, id do botão e tag/classes do alvo), sem texto/valores. O mapa passa a incluir falhaCadastro a partir da última etapa do cadastro ou salvamento individual, resolvendo o caso em que falhaLocalizacao era null depois da navegação bem-sucedida. Não houve salvamento real nesta alteração. Próximo uso com o vínculo já preenchido: atualizar, importar mesmo cartão, usar Retomar uma tentativa interrompida / Conferir vínculo preenchido para salvar, sem Novo nem nova pesquisa. Resultados incertos continuam exigindo releitura antes de outra tentativa.

Verificação 0.14.5: passaram 16 testes DOM do salvamento, sete de fluxo PDF/conexão e 14 UI de integração (37 afetados). Os novos casos cobrem cobertura transitória/persistente, ativação solicitada sem clique, sufixo real do footer, campo EspecificarCNAE, retorno à aba do aplicativo e proibição de repetir salvamento incerto mesmo com ativacaoNecessaria. O mapa exportado também foi testado com falhaCadastro.


## Acionamento semântico do Salvar do formulário — 0.14.6 (20/10/2026)

O novo mapa mostra falhaCadastro salvar, salvamentoAcionado false: após espera o hit-test retornava button.btn.btn-default.btnFooter.btnFooterDesfazer, embora botaoId fosse btnFooterSalvar do formulário e noViewport true; abaVisivel registrada false. A mensagem final dizia cobertura persistente, indicando que depender desse teste de coordenadas continua inadequado para a automação na aba de fundo. Não foi enviado clique em Salvar ou em Desfazer. O mapa não prova exatamente qual combinação de layout/compositor causou a divergência.

Quando o botão tem tag BUTTON e ID btnFooterSalvar com GUID normalizado exatamente igual ao sufixo dos campos conferidos, a 0.14.6 usa HTMLButtonElement.prototype.click.call no próprio botão identificado. Esse caminho não depende de elementFromPoint nem de posição de tela e não aciona o elemento retornado no hit-test. Confere novamente Id 0, Serviço/nome/datas, opção CNAE Não, Salvar(1), habilitação e ausência de diálogos/modal-backdrop/inert. Uma camada modal transitória tem espera limitada; diálogos persistentes bloqueiam. Botões genéricos sem ID de formulário mantêm a verificação geométrica e eventual ativação segura da aba da 0.14.5. Identificação de outro formulário é recusada. Mantém uma tentativa por seleção e nenhuma repetição após resultado incerto. Diagnóstico de sucesso inclui método usado, além do ID definitivo; persistência só continua após releitura da tabela.

O teste reproduz especificamente elementFromPoint retornando Desfazer em aba oculta: o botão Salvar correto é acionado uma vez, Desfazer zero vezes e a origem é registrada. O método click de instância também é sobrescrito no teste para conferir uso da API DOM nativa. Foram mantidos testes de overlays para o caminho genérico e de diálogos/inert para o caminho identificado. Não houve salvamento real nesta correção; preservar o vínculo já preenchido para retomada, sem Novo.

Verificação 0.14.6: passaram 18 testes DOM do salvamento, sete de fluxo PDF/conexão e 14 UI (39 afetados), incluindo botão nativo exato, Desfazer nunca acionado, diálogo/inert bloqueados, tentativa única e resultados incertos não repetidos.


## Salvamento automático confirmado — 0.14.6 (20/10/2026)

O relatório real comparacao-centi-1792505151524.json confirmou ultimoCadastro.ok true, concluido true, resultadoIncerto false e salvo true. Para 07.02.000, ID municipal 214, alíquota 4%, a fila abriu vínculo novo, pesquisou/selecionou a terceira linha pela API Wijmo e clique, preservou início 20/10/2026 e fim vazio, acionou Salvar uma vez pelo método botao_identificado_por_formulario e observou o ID definitivo 16200. Em seguida voltou a Serviços e a releitura pela API pública localizou o vínculo 16200 com Serviço exibido como 214. Isso confirma persistência pela automação e reconhecimento pós-salvamento nesse caso real; não é salvamento manual nem somente conferência do formulário.

Os dois serviços da lista foram localizados: 07.02.000 no novo vínculo 16200 e 07.03.000 no vínculo existente 3675. Há dez vínculos lidos, zero pendentes, zero linhas não interpretadas e nenhum vínculo sem identificação. O existente 07.03.000 foi ignorado pela fila, sem nova inclusão. Não repetir seleção, salvamento ou criação de 07.02.000; esse caso está concluído.

O campo salvo false dentro de ultimoCadastro.comparacao pertence ao comparador somente-leitura; a ação executada está em ultimoCadastro.etapas/salvar com salvo true e no resultado externo salvo true. Não tratar essa diferença de escopo como falha ou pedir nova tentativa. A captura ainda declara leituraCompleta false e empresaVerificadaAutomaticamente false; o relatório não registra os passos anteriores de login/localização de empresa. Não atribuir a este arquivo prova de abertura com Centi fechada ou de todos os passos de navegação da empresa. A validação cobre cadastro/seleção/salvamento/releitura deste serviço, sem generalizar para todas as empresas, CNAEs, filtros, páginas ou heranças.


## Outra empresa sem nenhum serviço — 0.14.7 (20/10/2026)

O usuário testou outra empresa e o mapa parou em navegarServicosCenti / aguardar_lista_servicos. A pasta Serviços estava selecionada; havia uma única gridCollectionTotal/tableSearch/wj-state-empty com API pública disponível, zero linhas e zero colunas, sem filtros ou formulário. O usuário confirmou explicitamente que essa empresa está sem vínculos em Serviços. Não interpretar o caso como falha da pesquisa, ausência de cadastro da empresa ou motivo para repetir o caso concluído 07.02.000/16200.

O código 0.14.6 exigia cabeçalhos/colunas para aceitar a lista, impedindo o primeiro vínculo quando a grade vazia não gera esquema. A 0.14.7 reconhece uma coleção vazia sem colunas somente com contexto único da árvore Serviços, grade de coleção vazia conhecida, API presente, fonte sourceCollection e items sendo arrays vazios, linhas/colunas zero, nenhum isLoading/isUpdating/aria-busy ativo, total declarado zero quando presente e sem múltiplas páginas. A mesma fonte/view precisa permanecer estável por 700 ms; cache interno compartilhado em MAIN liga a confirmação da navegação à leitura. Fonte ausente, filtro com fonte não vazia, total positivo e carregamento explícito não provam vazio.

O leitor retorna captura válida de zero registros/pendências, origemLeitura api_publica_lista_vazia e leituraCompleta false; não inventa cabeçalhos ou dados de células. O navegador permite Novo após essa confirmação; depois do primeiro salvamento o leitor normal/API com colunas retoma. Mapa passou a incluir presença/tamanho de fonte/itens, isLoading e total declarado, sem valores. Não houve operação na Centi real nesta correção, e a leitura continua limitada à coleção/página atual, sem garantia sobre heranças ou filtros remotos.

O retorno após Salvar também recebeu idVinculoEsperado: a navegação só confirma a lista quando o ID salvo aparece na API/DOM, antes da releitura de validação. Isso evita aceitar imediatamente a antiga coleção vazia enquanto o primeiro registro ainda está sendo carregado. Se o ID não reaparecer, para sem repetir a inclusão. Não exige esse ID na abertura inicial da pasta antes de qualquer cadastro.

Verificação 0.14.7: passaram 14 testes de leitura, dez de navegação, sete de fluxo PDF, 14 UI de integração, sete de pesquisa/abertura de empresa e nove Node da fila (61 afetados). Os novos casos cobrem coleção sem esquema e fonte estável, recusa durante carregamento/fonte ausente/filtro/total positivo, primeiro Novo e espera pelo ID salvo. O usuário confirmou que esta outra empresa está sem vínculos; validação do primeiro cadastro nela ainda pendente.
