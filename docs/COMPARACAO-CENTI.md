# Cadastro com a Centi — versão 0.14.5

## Entrada atual — pode começar com a Centi fechada

Clique no ícone em qualquer aba, importe o PDF, confira os serviços e use **Iniciar cadastro automático na Centi**. O aplicativo abre/reutiliza a Centi e aguarda login. Localiza a empresa por Arrecadação → Atividade econômica → AR022 → CPF/CNPJ → Pesquisar. Confere CNPJ exato/ID e abre o resultado; entra em Serviços e continua a comparação/cadastro. O navegador pode pedir habilitação do acesso da extensão a ba.centi.com.br. O acesso é restrito à origem Centi; não há manipulação de senhas.

As novas navegações ainda precisam de validação real. Não escolher cadastro ambíguo ou empresa sem CNPJ exato. Em erro, exporte **Baixar mapa da tela Centi** e a comparação, se disponível. Pendências são preservadas. A leitura de Serviços permanece parcial quanto a filtros, páginas e heranças.

## Histórico do roteiro 0.13 — PDF para cadastro

1. Abra a empresa na Centi, deixe a tabela da pasta Serviços visível e clique no ícone da extensão.
2. Importe o cartão CNPJ atual em PDF, informe coworking, confira os dados e selecione os serviços.
3. Confirme a lista e use **Continuar para cadastrar na Centi**. O aplicativo passa a lista internamente; baixar/importar JSON não faz parte do caminho normal.
4. O CNPJ vem do PDF, sem edição nesta etapa. Confirme a mesma empresa aberta na Centi e compare os vínculos.
5. Confira ausência inclusive fora da captura e ausência de outras alterações pendentes. Use **Adicionar e salvar na Centi**.
6. A fila ignora os localizados. Para cada ausente, abre Novo, pesquisa/seleciona, confere datas (hoje em São Paulo e fim vazio) e Especificar CNAE = Não, salva uma vez, observa ID definitivo e relê Serviços. Somente avança após localizar o vínculo com o mesmo ID.

Falhas interrompem a fila. Não repetir a inclusão de serviço já salvo nem uma tentativa com resultado incerto. O relatório **Baixar comparação** inclui `ultimoCadastro`, com cada etapa e código, a última captura e a última comparação. O fluxo é limitado pela leitura renderizada e correspondências CNAE disponíveis; a confirmação externa da empresa, páginas, filtros e herança é manual.

O teste de navegador usa PDF real sintético, extração PDF.js e ações Centi simuladas. Navegação Novo/Serviços e salvamento automático ainda não estão validados na Centi real. Se controles não forem identificados de forma única, o fluxo bloqueia. A identificação de Especificar CNAE aceita o ID esperado ou uma associação explícita label/for, sem adivinhar pelo índice de opções.

O caso anterior dos cinco serviços está concluído. Não refazer seus vínculos para testar. O restante deste documento preserva instruções de etapas anteriores, incluindo uso avançado de JSON e operações individuais.

## Salvamento após revisão — novo na 0.12.0

Após seleção ou conferência manual bem-sucedida, a seção **Salvar o vínculo conferido** apresenta o serviço. Revise o cadastro e confirme que este é o único registro pendente. A ação confere novamente Id 0, Serviço, descrição e datas; exige Especificar CNAE = Não e um único Salvar(1) visível e habilitado. Aciona uma vez e aguarda ID definitivo no mesmo formulário. Volte à tabela Serviços e refaça a comparação para confirmar a presença na lista.

O relatório inclui `ultimoSalvamento`. Antes do clique, bloqueio retorna `salvo: false`; depois do clique sem confirmação ou sem retorno da aba, retorna `salvo: null`, exige releitura e não oferece repetir a mesma tentativa. `salvo: true` significa ID definitivo observado no formulário, ainda sujeito à releitura. A revisão da empresa e de outras alterações pendentes é manual. Não salva em lote.

Essa ação passou por testes simulados, mas ainda não foi validada na Centi real. Os diagnósticos antigos não identificaram o ID DOM de Especificar CNAE. Se o seletor conservador não corresponder à tela real, a ação bloqueia antes de clicar; será necessário mapear o campo. Não repetir inclusões do caso concluído para validar a nova ação.

## Histórico operacional até 0.11.2

As instruções abaixo preservam a validação anterior sem salvamento pela extensão. Para a versão atual, use o roteiro acima e LEIA-ME.txt.

## Instalação

Baixe o ZIP do repositório e extraia. No Chrome/Edge, abra Extensões, ative o modo do desenvolvedor e carregue sem compactação a pasta **C-dex-main**, que contém o manifesto principal 0.11.2. Esta é a aplicação completa; não selecionar `tools/diagnostico-centi`, que continua sendo a ferramenta separada 0.2.0. Ao atualizar uma pasta já carregada, recarregue a extensão e confira a versão exibida. A versão 0.11.2 requer activeTab e scripting para ler a aba Centi após o clique no ícone.

## Usar

1. Gere e baixe a lista conferida da empresa pelo fluxo PDF do Ponte Centi. Para abrir esse fluxo, clique no ícone da extensão a partir de uma aba que não seja a Centi.
2. Na Centi de Caetité, abra a mesma empresa e selecione a pasta Serviços, exibindo a tabela com ID, Serviço, Data início e Data fim. Deixe o formulário de vínculo e a lupa fechados.
3. Nessa aba Centi, clique no ícone do **Ponte Centi** (aplicativo completo, versão 0.11.2). Será aberta uma nova aba de comparação; mantenha a aba Centi aberta. Se ainda tiver apenas o PDF, use o link **Gerar lista conferida a partir do PDF**; ele abre a consulta em outra aba, preservando a comparação.
4. Selecione o JSON da lista conferida. Informe o CNPJ que você verificou no cadastro da Centi e marque a confirmação da empresa.
5. Clique em Ler vínculos visíveis e comparar. A aplicação lê os vínculos renderizados na aba indicada e compara as descrições exatas normalizadas com o catálogo municipal. ID do vínculo e ID do catálogo são tratados separadamente.
6. Revise os resultados e, se necessário, clique em Baixar comparação. O JSON contém CNPJ confirmado pelo operador, dados dos serviços da lista e ID/descrição/datas dos vínculos lidos; compartilhe-o apenas se desejar que esses dados sejam analisados.

## Como interpretar

- **Localizado na captura:** há um vínculo identificado com o mesmo código, registro municipal e alíquota. Ainda é necessário conferir vigência.
- **Conflito:** foi identificado o mesmo código com outro registro/alíquota ou mais de um vínculo.
- **Não localizado nesta captura:** a leitura atual não encontrou correspondência. Isso não comprova ausência no cadastro nem autoriza nova inclusão.
- **Sem identificação:** descrição ausente ou ambígua no catálogo; inclui serviços históricos como o 13.01.000 (VETADO) da captura fornecida. Não excluir ou recadastrar automaticamente.

O aplicativo não clica em Novo nem aciona Salvar. A pesquisa opcional altera os filtros da lupa; a opção de seleção também preenche o Serviço por duplo clique. As datas não são escritas e são comparadas antes/depois quando há seleção. Não percorre páginas, não rola a grade e não lê serviços herdados automaticamente. O CNPJ é confirmado pelo operador, não detectado na página. O relatório é sempre parcial e retorna `podePreencher: false`.

## Pesquisar pela lupa sem selecionar ou salvar

1. Faça a comparação. A seção de pesquisa aparece somente se houver serviços não localizados na captura; serviços já localizados ou em conflito não são oferecidos.
2. Escolha um serviço nessa seção. O relatório real recebido oferece 09.02.000 (ID municipal 238) e 10.03.000 (ID municipal 51), ambos a 4%.
3. Volte à Centi, confira a empresa e confirme manualmente que esse código não está cadastrado, incluindo filtros, páginas e Serviços herdados CNAE. Se já existir ou houver dúvida, não prossiga com a pesquisa para inclusão.
4. No grupo Serviços, abra um vínculo novo. Deixe Id 0, Serviço vazio e a lupa fechada. Não altere ou descarte outros vínculos pendentes para executar o teste.
5. Volte à aba de comparação, marque a confirmação específica e clique em Abrir lupa e pesquisar — sem selecionar nem salvar.
6. A extensão abre a lupa, define Código / Contendo / código escolhido e Situação / Igual / Ativo e aciona Pesquisar. Exige atualização observada da grade e uma única linha com ID, código, descrição e alíquota exatos.
7. Confira a mensagem e o resultado na Centi. Use Baixar comparação para exportar também `ultimaPesquisa`. Não selecione nem salve o serviço para este teste. Em caso de falha, confira a tela antes de repetir: a lupa ou os filtros podem ter mudado.

A pesquisa não comprova ausência de duplicidades e não muda `podePreencher: false`. O botão somente de pesquisa não seleciona a linha, não preenche datas e não salva. A opção adicional de seleção está descrita abaixo; salvamento continua fora desta versão. Não é necessário gerar novamente a lista JSON para cada atualização.

## Selecionar o serviço por duplo clique — sem salvar

A seleção manual por duplo clique foi confirmada pelo usuário. Para testar a opção automatizada:

1. Faça a comparação com a lista JSON existente e escolha o serviço desejado entre os não localizados.
2. Confirme a mesma empresa e a ausência do serviço nas páginas, filtros e serviços herdados.
3. Na Centi, deixe o vínculo novo aberto (Id 0, Serviço vazio). Feche a lupa de um teste anterior se estiver aberta. Não descarte outras alterações pendentes.
4. Na comparação, marque a confirmação específica e clique em **Pesquisar e selecionar — sem salvar**.
5. A extensão refaz a busca, exige resultado atualizado e único e obtém a grade pela API pública Wijmo, encontra o registro exato por colunas e valores, seleciona sua linha e verifica se essa seleção permaneceu. Só então dispara o evento de duplo clique na célula do ID. Aguarda a lupa fechar e confere ID/código e descrição no mesmo formulário novo. Verifica se Data início e Data fim permaneceram iguais às anteriores; não escreve datas.
6. Confira o Serviço e os demais campos na Centi sem clicar em Salvar para este teste. Baixe a comparação para registrar `ultimaPesquisa`, `selecionado`, `datasPreservadas` e os campos conferidos.

A conferência é parcial: não valida Especificar CNAE, vigência, herança ou empresa automaticamente. Ao selecionar com sucesso, o código sai das opções dessa sessão, mas não passa a ser considerado salvo. Para outro vínculo, é necessária nova conferência. Se houver falha após o duplo clique, o campo Serviço pode já estar alterado; não há reversão automática nem novo salvamento. Erros de execução substituem o resultado exportado anterior e deixam a seleção como não confirmada.

## Validação

- `node --test tests/conciliacao.test.mjs tests/comparar-captura.test.mjs`: 21 testes passaram.
- `node --test tests/worker.test.mjs`: três testes da abertura do aplicativo passaram.
- `python tests/ler-vinculos-centi.py`: oito testes DOM com Playwright/Chromium passaram.
- `python tests/integracao-ui.py`: 10 testes da interface em navegador com API Chrome simulada passaram, incluindo importação, comparação, exportação, invalidação após alterar o CNPJ, rejeição orientada de PDF/JSON inválido/diagnóstico abertura da consulta em outra aba e pesquisa condicionada à confirmação com exportação do resultado.

- `python tests/pesquisar-servico-centi.py`: 16 testes DOM passaram, incluindo seleção pela API pública seguida de duplo clique, três alíquotas com o registro correto na terceira linha, recusa de API indisponível ou seleção não retida e seleção por duplo clique, preservação de datas, rejeição de retorno incorreto ao formulário e pesquisa atualizada, ausência de seleção/salvamento, recusas de formulário existente, falta de confirmação, domínio incorreto, resultados antigos, divergentes ou duplicados.

Os testes locais usam páginas simuladas. A leitura e comparação foram observadas na Centi real na versão 0.8.1. A pesquisa 0.9.0 foi validada no relatório real comparacao-centi-1792416949140.json: serviço 09.02.000, ID 238, pesquisa_conferida, sem selecionar ou salvar. A seleção nova 0.10.1 ainda precisa ser validada pelo operador. O diagnóstico 0.2.0 fornecido pelo usuário confirmou cabeçalhos duplicados, cinco células por linha e sete linhas renderizadas, mas não seus conteúdos; não é prova de que exista uma cópia de medição específica na tela real. O leitor só unifica repetições com o mesmo ID de vínculo e os mesmos dados; IDs diferentes nunca são unificados.

## Correção da seleção 0.10.1

O relatório real comparacao-centi-1792418316642.json mostrou timeout após acionar duplo clique. A captura posterior mostrou a lupa ainda aberta, primeira linha ID 740 / 5% destacada e registro correto ID 238 / 4% na terceira linha. Isso não demonstra que o serviço de 5% tenha sido preenchido ou salvo; a seleção não foi confirmada. A hipótese tratada nesta correção é a ausência de mudança da seleção interna da grade pelos eventos sintéticos anteriores.

A seleção agora executa no contexto principal da página para acessar a API pública `wijmo.Control.getControl`. Usa `columns`, `rows`, `getCellData`, `select` e a seleção pública; não lê propriedades privadas. Se a API não estiver exposta pela instalação da Centi ou houver divergência, interrompe antes do duplo clique e registra detalhes. Em timeout após o duplo clique, registra também os valores do Serviço e datas observados e a quantidade de lupas abertas. Esses dados são do formulário de serviço e estarão no JSON exportado.

A correção passou em 12 testes DOM de pesquisa/seleção e nove testes UI com API Chrome simulada. A API Wijmo é simulada nesses testes; sua disponibilidade e a seleção efetiva na instalação Centi do usuário ainda precisam ser validadas. Para testar, atualizar a extensão, fechar a lupa anterior, refazer a comparação na pasta Serviços e reabrir o vínculo novo vazio, preservando alterações pendentes. Usar Pesquisar e selecionar e exportar o resultado, sem clicar em Salvar.

## Ativação e conferência manual — 0.10.2

O relatório real comparacao-centi-1792419418894.json confirmou que a API pública existe e selecionou a terceira linha (ID 238, 4%), mas a lupa permaneceu aberta e os campos Serviço ficaram vazios. Portanto seleção da linha e ativação da escolha são etapas distintas; a ativação automática ainda não foi validada.

A versão 0.11.2 preserva a pré-seleção conferida, procura o elemento sob o centro da célula e envia a sequência de cliques e duplo clique a esse elemento interno. Interrompe eventos adicionais se a lupa fechar ou se a seleção mudar. O relatório registra o alvo e os eventos enviados. Esses eventos continuam sintéticos; os testes não provam que a Centi real os processará.

Para conferir a escolha feita pelo operador:

1. Faça a comparação e mantenha o serviço esperado selecionado no Ponte Centi.
2. Na Centi, escolha a linha exata manualmente. Para o teste observado: ID **238**, código **09.02.000**, alíquota **4,00** (não a linha 740 / 5%). Dê o duplo clique e aguarde voltar ao formulário do vínculo novo Id 0, sem salvar.
3. Na aba Ponte Centi, clique em **Conferir seleção manual — sem salvar**. Esse botão não exige a confirmação de Serviço vazio, pois agora ele deve estar preenchido; usa a confirmação de empresa da comparação.
4. A conferência apenas lê ID/código e descrição do Serviço e as datas do formulário; não envia cliques, não pesquisa e não altera campos. Recusa serviço diferente, vínculo já salvo ou lupa ainda aberta. A origem da seleção é registrada como **operador**, e não como automação.
5. Se houver datas anteriores registradas da mesma tentativa, compara-as; caso contrário, `datasPreservadas` é null, não uma confirmação de preservação. A validação de Especificar CNAE e demais regras continua manual.
6. Baixe a comparação para registrar os campos conferidos. O vínculo continua não salvo.

Passaram 16 testes DOM da pesquisa/seleção/conferência e 10 UI com API Chrome simulada nesta etapa. O teste com elemento interno exige dois cliques antes do duplo clique; os testes manuais verificam ausência de alterações, serviço incorreto, lupa aberta e comparação de datas. A nova ativação automática e a conferência manual ainda dependem da validação do operador na Centi real.

## Seleção automática confirmada — 0.10.2 / mensagem corrigida em 0.10.3

O relatório real comparacao-centi-1792419986717.json confirmou sucesso para 09.02.000/238, com código 09.02.000 e descrição de 4% no vínculo novo Id 0. A data início 19/10/2026 e a data fim vazia foram preservadas. A sequência registrada terminou no primeiro click após a pré-seleção pela API Wijmo: não houve dblclick e a conferência manual não foi usada. Nenhum botão Salvar foi acionado.

A versão 0.11.2 corrige a mensagem de sucesso para não atribuir incorretamente a operação a duplo clique e exporta metodoAtivacao (clique ou duplo_clique). Um novo teste reproduz o fechamento no primeiro clique e garante que nenhum evento adicional seja enviado. Os 17 testes DOM da pesquisa/seleção/conferência passaram. Não é necessário repetir a seleção já concluída apenas para atualizar a mensagem.

A validação continua parcial: o relatório não verifica Especificar CNAE. Próximo passo: conferir o formulário preenchido, incluindo esse campo e os demais dados, antes de qualquer salvamento ou preparação de outro vínculo. Não repetir pesquisa no vínculo já preenchido.

## Vínculos novos já preenchidos — 0.11.0

A captura do formulário após o teste real confirmou Serviço 09.02.000, data início 19/10/2026, data fim vazia e Especificar CNAE = Não. O campo Id ainda era 0 e o botão Salvar(1) indicava alteração pendente. A conferência de Especificar CNAE foi visual nessa captura; o aplicativo ainda não lê esse campo automaticamente.

Na versão 0.11.2, a leitura da lista separa linhas renderizadas com Id 0 e descrição preenchida em `vinculosPendentes`, sem tratá-las como vínculos salvos nem descartá-las como inválidas. Uma correspondência única de catálogo para o serviço da lista recebe `preenchido_sem_salvar` e não é oferecida para nova pesquisa/inclusão. Um vínculo existente mais um novo com o mesmo código, ou dois novos iguais, gera conflito. Vínculos Id 0 não são unificados apenas por terem os mesmos dados. Pendências sem correspondência no catálogo são destacadas para revisão.

A proteção depende de o vínculo pendente estar renderizado na grade com Id 0 e descrição reconhecível. A leitura continua parcial e não prova completude, persistência ou ausência de outras pendências. O programa continua sem clicar em Salvar. Não repetir a seleção no vínculo já preenchido.

Para efetivar o vínculo, o operador decide e salva manualmente na Centi. Só considerar salvo após observar a conclusão e um ID definitivo/lista atualizada; não interpretar a presença do serviço no formulário como confirmação de salvamento. Depois, reler a pasta Serviços com o mesmo JSON para verificar que 09.02.000 está localizado e deixou de ser candidato. O serviço 10.03.000 ainda não foi selecionado nem testado na Centi real.

Testes desta etapa: `node --test tests/comparar-captura.test.mjs` (11), `python tests/ler-vinculos-centi.py` (9), `python tests/integracao-ui.py` (11), todos passados. Os testes de pendências são simulados; ainda não houve leitura real dessa nova versão antes/depois de salvar.

## Referência numérica após salvar — 0.11.1

O relatório real comparacao-centi-1792421312126.json mostrou sete vínculos, incluindo o novo vínculo com ID 16192, data início 19/10/2026 e campo Serviço exibido como "238". A comparação anterior aceitava apenas descrições e não resolveu essa referência. Por isso ofereceu indevidamente 09.02.000 para inclusão; a tentativa registrada no relatório foi bloqueada antes de interação por ausência de formulário novo. Não repetir essa inclusão.

A versão 0.11.2 aceita uma referência formada exclusivamente por ID numérico positivo na coluna Serviço e consulta o catálogo ativo por esse ID exato. Nunca usa o ID do vínculo para isso. Correspondências múltiplas permanecem ambíguas; códigos sem alíquota, números parciais e IDs desconhecidos não recebem aproximação. O relatório registra identificadoPor/formasIdentificacao. A mesma regra vale para vínculos novos Id 0, mantendo seu estado pendente.

O JSON real foi reprocessado localmente com a lista conferida original: 09.02.000 ficou localizado no vínculo 16192; 08.02.000, 13.02.000 e 17.06.000 também ficaram localizados; apenas 10.03.000 permaneceu não localizado na captura. O vínculo histórico (VETADO) continua sem correspondência. Esse reprocessamento não executou comandos na Centi e não comprova ausência em páginas/filtros/herança.

Passaram 16 testes Node da comparação e 12 UI com API Chrome simulada, incluindo prevenção da nova oferta de um serviço exibido por ID. Próximo teste na extensão: atualizar a raiz para 0.11.1 e refazer somente a comparação na pasta Serviços; não selecionar 09.02.000 novamente. Para preparar 10.03.000, confirmar sua ausência e usar um vínculo novo vazio, sem salvar automaticamente. O campo legado salvo=false registra que a extensão não acionou salvamento; não significa que o operador não tenha salvo manualmente os vínculos com ID definitivo.

## Motivo de falha na leitura — 0.11.2

Uma captura da comparação 0.11.1 exibiu "A aba da Centi não retornou a leitura". Essa mensagem, sozinha, não determina a causa: pode haver estado incorreto da tela, contexto/aba desatualizado ou falha de execução. Não atribuir a falha a formulário aberto como fato sem nova observação.

O leitor agora captura seus erros internos e retorna um objeto serializável erro_leitura_centi com o motivo. A interface mostra esse motivo, inclusive quando a lupa ou um formulário de vínculo impede comparar, em vez de tratá-lo como retorno vazio. A instrução visual também explicita a sequência: comparar primeiro com a tabela Serviços visível; abrir vínculo novo somente depois, para pesquisa/seleção.

Para retomar, voltar à Centi e selecionar a pasta Serviços (não um vínculo filho), deixando a tabela visível e a lupa fechada. Clicar no ícone da extensão nessa aba para abrir uma comparação nova e renovar a referência à origem. Importar o mesmo JSON e comparar. Só depois abrir um novo vínculo e retornar à comparação pronta para preparar 10.03.000. Não descartar alterações pendentes nem recadastrar 09.02.000.

Passaram nove testes DOM do leitor e 13 testes UI com API Chrome simulada; os testes confirmam retorno de erro serializável e exibição do motivo sem oferecer resultados/ações de pesquisa. A causa da captura real ainda precisa ser confirmada caso a sequência correta não resolva.


## Resultado final do caso real

O relatório comparacao-centi-1792426509098.json confirmou os cinco serviços selecionados como localizados: 08.02.000, 09.02.000, 10.03.000, 13.02.000 e 17.06.000. Os dois novos vínculos aparecem com IDs definitivos 16192 e 16198, respectivamente. Há oito vínculos com ID na captura, zero pendentes identificados e zero linhas não interpretadas. A lista não deve mais oferecer serviços para nova inclusão. Não repetir as inclusões ou salvamentos.

O teste desse caso está concluído: comparação, seleção assistida, salvamento manual e releitura com reconhecimento dos registros. O programa não salvou automaticamente. O vínculo histórico (VETADO) continua sinalizado sem correspondência no catálogo. O sucesso cobre os cinco serviços selecionados; não comprova correspondências completas de todos os CNAEs, ausência em páginas/filtros/herança ou validação de todos os cadastros.

## Retomar bloqueio antes de Salvar — 0.13.1

Se a mensagem confirma que nenhum Salvar foi acionado, preserve o formulário preenchido. Após atualizar, importe o mesmo cartão, confira a lista e continue para cadastro. Use **Conferir vínculo preenchido para salvar**, após confirmar a empresa e que esse é o único pendente. Não use Novo nem repita a pesquisa. A ação lê Serviço e datas e apresenta **Salvar vínculo na Centi** para revisão. Depois do salvamento, volte à tabela e compare. Não usar essa rota para repetir um resultado de salvamento incerto.

O campo Especificar CNAE pode ser identificado pelo título no mesmo grupo visual, além de ID e associação explícita. Ambiguidade ou ausência continuam bloqueando; o relatório de falha inclui diagnosticoCnae para mapear a estrutura real. Essa correção ainda requer validação na Centi.

## Cartão AR022 e mapa atualizado — 0.14.1

O cartão de Cadastros pode usar div/li com clique delegado; agora é identificado pelo título e código exatos no menor grupo visível, com unicidade. O mapa v2 relê a tela no momento do download e inclui ancestrais estruturais e função/etapa da falha. O mapa v1 anterior podia registrar a tela inicial em vez do estado após o erro. Em bloqueio, envie o novo mapa sem navegar manualmente.

Correção 0.14.2: o mapa real mostrou Atividade econômica em div.sidebarSubItens sem role/onclick. Esse controle agora é reconhecido pelo rótulo exato; com submenu visível, não procura Arrecadação antes. A continuidade ainda precisa de validação na Centi real.

0.14.3: o novo mapa parou em navegarServicosCenti ao confirmar Serviços, já selecionado na árvore. A navegação usa o divTreeSelected observado e cabeçalhos visíveis como o leitor. Mapa v3/falhaLocalizacao incluem estrutura das grades, cabeçalhos conhecidos, contagem de linhas e etapa de espera; não copiam dados das células. A continuidade ainda depende de validação real.

0.14.4: o mapa v3 confirmou que os cabeçalhos de data não estavam renderizados na espera, embora aparecessem depois. A identificação/leitura agora aceita metadados e getCellData da API pública Wijmo, sem depender da renderização de todas as colunas. Mantém bloqueio por coluna ausente/ambiguidade e fallback DOM completo. A captura indica origemLeitura e continua parcial quanto a paginação, filtros e herança. Mapa v4 registra metadados da API, sem valores de células.

0.14.5: bloqueio real antes de qualquer clique por Salvar coberto. Agora espera transições/hit-test, rola o botão à vista e confere sufixo do btnFooterSalvar. Aba oculta pode solicitar ativação; a interface só ativa e reconfere se salvo=false e salvamentoAcionado=false explícitos. Não ignora cobertura persistente nem repete resultado incerto. Mapa inclui falhaCadastro/diagnosticoSalvar. Preservar e retomar o vínculo já preenchido, sem Novo. Persistência automática real ainda precisa ser observada.
