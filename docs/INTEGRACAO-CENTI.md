# Integração Centi — evidências recuperadas

## Caso real mais recente — 0.14.7

O relatório comparacao-centi-1792505829322.json confirmou cadastro sequencial automático na empresa que o operador havia confirmado sem serviços: 07.02.000/214/4% salvo no vínculo 16201 e 07.05.000/217/4% salvo no vínculo 16202. A fila observou os IDs definitivos, voltou à lista e confirmou ambos localizados. ok/concluido true, resultadoIncerto false, zero pendentes/linhas não interpretadas. Não refazer essas inclusões. A evidência é específica desse caso e não comprova páginas/herança ou abertura inicial com Centi fechada.

## Estado real validado — 0.14.6

O relatório comparacao-centi-1792505151524.json confirmou a fila com ok/concluido true, salvo true e resultadoIncerto false. O programa abriu o vínculo, pesquisou/selecionou 07.02.000 (municipal 214, 4%), acionou Salvar uma vez pelo botão identificado, observou ID definitivo 16200, voltou a Serviços e confirmou o mesmo vínculo na releitura pela API pública. O 07.03.000 já existente foi localizado no vínculo 3675 e não foi incluído de novo. Dez vínculos lidos, zero pendentes/linhas não interpretadas/sem identificação. Não repetir esse caso.

Essa é evidência real de salvamento automático e releitura, sem salvamento manual. Não comprova todas as empresas nem cobertura de páginas/filtros/herança. O relatório não contém as etapas anteriores de login/localização da empresa; não afirmar validação completa da entrada com Centi fechada somente a partir dele. O restante é histórico.

## Histórico 0.14.0

O usuário definiu início com Centi fechada e somente login manual. O aplicativo agora abre/reutiliza a aba com permissão de host limitada a ba.centi.com.br, preserva o plano do PDF e aguarda login. O caminho informado é Arrecadação → Atividade econômica → AR022 → CPF/CNPJ/Contendo/Pesquisar → duplo clique na linha exata → Serviços → comparar → Novo para os ainda não localizados. A seleção da empresa cruza CNPJ exato e ID da grade com o ID do cadastro aberto. Em sucesso, a fila é iniciada pela autorização do botão Iniciar cadastro automático, sem exigir preparação manual da tabela. 110 testes locais/simulados passaram. Os controles reais novos ainda precisam de validação; leitura de páginas/filtros/herança permanece parcial e não houve operação real nesta etapa. Controles ambíguos, outros vínculos pendentes e ausência de resultado interrompem sem criar empresa ou descartar dados.

## Histórico 0.13.0

O usuário corrigiu o objetivo: PDF da empresa atual → serviços filtrados → adicionar e salvar na Centi. A entrada padrão agora é consulta.html vinculada à aba Centi, com passagem interna do plano por sessão, sem exportação/importação de JSON. A integração preenche e protege o CNPJ vindo do PDF. cadastrar-servicos.mjs coordena a fila e exige releitura pelo ID salvo antes do próximo vínculo; navegar-servicos-centi.mjs automatiza Novo e retorno a Serviços por controles únicos. Em falha, interrompe sem repetir ações. Há teste completo com PDF real sintético e ações Chrome simuladas. A nova navegação e persistência ainda dependem de validação na Centi real; não repetir o caso já concluído. Veja LEIA-ME.txt para o fluxo atual.

## Histórico 0.12.0

O usuário priorizou automatizar o salvamento. A nova ação após revisão valida o formulário contra a seleção conferida, exige Especificar CNAE = Não e um único Salvar(1), aciona uma vez e observa ID definitivo. Falhas após o clique ou sem retorno são incertas e exigem releitura sem repetição. Testes simulados não validam a Centi real: o ID DOM de Especificar CNAE ainda não consta dos diagnósticos antigos. A identificação conservadora bloqueia se o campo não corresponder. Ainda falta validar o salvamento em um novo caso legítimo, preservando o caso concluído abaixo.

## Último estado validado na Centi real — 0.11.2

O caso real de cinco serviços selecionados foi concluído. A releitura final encontrou todos os cinco, incluindo os novos vínculos definitivos 16192 (09.02.000) e 16198 (10.03.000), após salvamento manual pelo operador. Nenhum desses serviços deve ser incluído novamente nesse cadastro. O relatório final encontrou oito vínculos com ID, zero pendentes identificados e zero linhas não interpretadas.

A seleção automática e a identificação por ID municipal estão validadas nesses dois serviços. O aplicativo não aciona Salvar. A conferência de Especificar CNAE continua manual; a leitura de linhas visíveis não comprova completude de filtros, páginas, herança ou todos os CNAEs. O vínculo histórico VETADO permanece para revisão. Veja RETOMAR.md para recuperar o projeto e COMPARACAO-CENTI.md para operar.

## Histórico de implementação

Os relatos abaixo descrevem o estado em cada etapa passada. Pedidos antigos de repetir testes ou incluir serviços foram superados pela conclusão acima.

Versão vigente 0.11.2: após comparação numérica validada, uma captura mostrou erro genérico de leitura, sem evidência da causa na aba Centi. O leitor agora serializa erros internos em erro_leitura_centi e a interface mostra o motivo. Nove testes DOM e 13 UI simulados passaram. Retomada: tabela Serviços visível, abrir a extensão pelo ícone nessa aba, comparar na nova aba e só então abrir o vínculo novo para 10.03.000. Não recadastrar 09.02.000. O histórico anterior permanece abaixo.

Versão vigente 0.11.1: o relatório real após salvamento/releitura mostrou novo vínculo 16192 com Serviço exibido como "238". A descrição não foi expandida e o comparador antigo falhou. A correção resolve esse ID exato no catálogo ativo, separadamente do ID do vínculo. O relatório real foi reprocessado e confirmou 09.02.000 localizado em 16192; só 10.03.000 continua não localizado na captura. Não repetir 09.02.000. Passaram 16 testes Node e 12 UI simulados; falta validar a nova comparação na extensão real. O campo salvo=false se refere à ausência de salvamento pela extensão e não invalida o salvamento manual observado pelo novo ID. O restante é histórico.

Versão vigente 0.11.0: a captura confirmou Especificar CNAE = Não no formulário real preenchido; Id 0/Salvar(1) ainda indicam pendência. A nova comparação reconhece linhas renderizadas com Id 0 e descrição como pendentes e não oferece serviços assim identificados para nova inclusão. Duas ocorrências geram conflito; não declarar pendência como salva. Testes desta etapa: 11 Node, nove DOM e 11 UI simulados passaram. Salvamento continua manual e ainda não foi observado; falta reler a lista após eventual efetivação para validar deduplicação persistida. O código 10.03.000 ainda não foi testado. Os demais parágrafos preservam o histórico.

A seleção automática 0.10.2 foi confirmada na Centi real pelo relatório comparacao-centi-1792419986717.json: 09.02.000/238 correto no formulário novo, datas preservadas, sem salvar. A ativação ocorreu no primeiro clique após selecionar a linha pela API, sem dblclick ou conferência manual. A versão vigente 0.10.3 corrige a mensagem e registra o método efetivo. Os 17 testes DOM passaram. Não repetir esse teste apenas para atualizar; conferir Especificar CNAE no formulário antes de qualquer salvamento. O restante desta seção é histórico.

Versão vigente 0.10.2: o relatório real mais recente confirmou que a seleção pública do Wijmo chegou à linha correta 238 / 4%, mas a ativação não fechou a lupa e os campos ficaram vazios. A nova versão envia eventos ao alvo interno da célula e adiciona conferência somente de leitura de uma seleção feita pelo operador, registrando essa origem. Passaram 16 testes DOM e 10 UI simulados; ambas as novas rotas ainda precisam de validação real. A ativação automática e o restante do preenchimento seguem pendentes. Instruções e limites em COMPARACAO-CENTI.md; estado vigente no fim de CONTEXTO.md.

A versão vigente é 0.10.1. O teste de seleção 0.10.0 falhou na conferência do retorno; a captura mostrou a lupa ainda aberta com a primeira linha (740 / 5%) destacada, e o alvo (238 / 4%) na terceira. A seleção usa agora a API pública do Wijmo em MAIN, verifica a linha selecionada e só então dá duplo clique; sem API ou seleção confirmada, interrompe. Testes: 12 DOM da pesquisa/seleção e nove UI simulados passaram. Falta validar API e seleção na Centi real. O histórico abaixo descreve versões anteriores; veja o final de CONTEXTO.md para a próxima validação.

A versão vigente é 0.10.0. A pesquisa 0.9.0 foi validada pelo usuário na Centi real para 09.02.000/238, sem seleção ou salvamento. O usuário confirmou seleção manual por duplo clique. A nova opção refaz a busca antes de selecionar, confere o Serviço no formulário e verifica preservação das datas, sem salvar; ainda falta sua validação real. A nova regra de cabeçalho só ignora uma linha quando todos os títulos coincidem com o modelo. Testes desta etapa: oito DOM do leitor, nove DOM de pesquisa/seleção e nove UI simulados. O restante desta seção preserva o histórico anterior; o estado vigente está no final de CONTEXTO.md.

A versão vigente é 0.9.0. A leitura/comparação já foi validada pelo usuário na Centi real em 0.8.1, com seis vínculos lidos e três serviços localizados. O JSON exportado confirmou as datas e a ausência de detalhes sobre uma linha descartada; o leitor agora coleta metadados estruturais desse descarte. A pesquisa opcional 0.9.0 foi reconstruída do trecho conhecido, com confirmação manual de ausência e vínculo novo vazio; abre a lupa, filtra e pesquisa com correspondência exata e atualização observada. Não seleciona, não preenche vínculo/datas nem salva. Testes desta etapa: sete UI, seis DOM leitor, cinco DOM pesquisa, todos passados. Falta validar a nova pesquisa na Centi real. Consulte COMPARACAO-CENTI.md e a seção final de CONTEXTO.md para o estado atual; os parágrafos seguintes registram o histórico.

O diagnóstico 0.2.0 real `diagnostico-centi-1792413452118.json` confirmou os cabeçalhos e cinco células por linha, mas contou sete linhas renderizadas e dois conjuntos de cabeçalhos. A aplicação principal 0.8.0 já contém a primeira comparação de leitura: a partir do ícone na aba Centi, importa o plano conferido, confirma CNPJ manualmente, lê a grade e resolve descrições contra o catálogo. Nunca autoriza preenchimento e não afirma completude. O leitor só deduplica renderizações com ID de vínculo e conteúdo idênticos; vínculos distintos com o mesmo serviço permanecem separados. São 33 testes locais passados, com DOM e API Chrome simulados. Ainda falta validação da extensão principal na Centi real. Uso e limitações em `COMPARACAO-CENTI.md`. As seções abaixo preservam o histórico do levantamento; a leitura parcial atual não implementa a automação de preenchimento planejada.

## Ponto validado anteriormente

### Diagnóstico da tela real recebido

O relatório `diagnostico-centi-1792412253300.json`, gerado em 19/10/2026, informa cinco campos visíveis: `Id` somente leitura, `IdServico`, seu campo secundário, `DataInicio` e `DataFim`; uma lupa; botão Novo; nenhum iframe; nenhum filtro e nenhuma grade reconhecida. Esses dados são compatíveis com um formulário de vínculo aberto, mas não estabelecem que a empresa não possui serviços cadastrados. A ferramenta não lê valores e não verificou que o ID do vínculo era zero.

Próxima captura necessária: tela da relação dos serviços vinculados, fora do formulário de inclusão/edição. Se a ferramenta continuar sem reconhecer a grade mesmo com a lista visível, obter uma captura de tela com dados da empresa ocultados para mapear a estrutura alternativa. Não tratar `grades: []` como lista de vínculos vazia nem autorizar inclusão com base nesse relatório.

O segundo relatório, `diagnostico-centi-1792412718698.json`, identificou uma lista Wijmo, sem campos de formulário, filtros, lupa ou iframe. Não reconheceu cabeçalhos/células pelos seletores ARIA da versão 0.1.0; portanto contagem zero não estabelece ausência de registros. A ferramenta 0.2.0 adiciona leitura estrutural pelas classes `.wj-colheaders .wj-cell`, `.wj-cells > .wj-row` e `.wj-cell`, com contagens dos painéis existentes no DOM. Sete testes simulados passaram, incluindo Wijmo sem ARIA e ausência de dupla contagem quando classes e ARIA coexistem. Falta validar o novo relatório na tela real. Captura com os dados da empresa ocultados também pode esclarecer uma estrutura não reconhecida.

O usuário forneceu `PESQUISA.CSV`: UTF-8 com BOM, delimitado por ponto e vírgula, 603 registros, 201 códigos distintos, com Id, CodigoCompleto, Nome, Aliquota, Nivel, PermiteDeducao, PermiteDeducaoForaDoMunicipio, PermiteForaMunicipio, Situacao e Classificacao. É o catálogo municipal, não uma lista identificada de vínculos da empresa: não contém CNPJ, identificador de empresa ou datas de vínculo. Todos os IDs coincidem com `data/servicos-centi-extraido.json`; as únicas seis diferenças são espaços no início do Nome (IDs 370, 616, 243, 641, 395, 141). Não houve substituição da base. O CSV confirma o registro 219 / 07.07.000 / 4,00 do teste antigo. Não usar esse catálogo como entrada de serviços já cadastrados na conciliação, pois isso classificaria incorretamente todo serviço do catálogo como existente para a empresa.

O usuário forneceu um manifesto da extensão de teste 0.5.0 e um relatório `teste_abertura_pesquisa_centi`, versão 3, gerado em 16/10/2026. O relatório informa `ok: true`, `etapa: campos_conferidos`, `pesquisaAcionada: true`, `pesquisaAtualizada: true` e `salvo: false`.

O caso registrado selecionou o registro municipal ID `219`, código `07.07.000`, alíquota `4,00`. A mensagem registra seleção pela lupa e conferência dos campos, sem acionar Salvar. Isso é evidência de um teste anterior fornecida pelo usuário, não uma execução nesta máquina. Não demonstra leitura dos serviços já cadastrados ou prevenção de duplicidades.

## Destino e mapa parcial da interface

O script fornecido restringe a operação a `https://ba.centi.com.br`, caminho iniciado por `/caetite/`.

- Campo principal: input com ID iniciado por `IdServico`, excluindo IDs terminados em `-second`.
- Campo descritivo: `IdServico<sufixo>-second`.
- ID do vínculo: `Id<sufixo>`, somente leitura, valor `0` para vínculo novo.
- Lupa: `.iconSearchReference`, no ancestral `.input-right` do campo descritivo.
- Grade da lupa: `.wj-flexgrid.tableFilterSearch--modal`, dentro de `[role=tabpanel]`.
- Dois filtros `.rowFilter`: campo em `.colCamposFilter select`, operação em `.colOperationFilter select`, valor em `.colFilterFilter`.
- Filtro Código: operação Contendo; filtro Situação: operação Igual, valor Ativo.
- Pesquisa: `button.btnPesquisar`.
- Resultados: `.wj-cells > .wj-row[role=row]`, células `.wj-cell[role=gridcell]`; a comparação utiliza ID, código, nome e alíquota, nessa ordem.

Esses seletores descrevem a pesquisa do catálogo municipal na lupa. Não são um mapa da lista de vínculos já cadastrados para a empresa.

## Proteções presentes no trecho fornecido

O código verifica domínio/município, confirmação do CNPJ, serviço válido, controles visíveis e sem sobreposição, vínculo novo e ausência de outro serviço pendente. Após a pesquisa, exige observar atualização da grade e encontrar uma única linha com ID, código, nome e alíquota esperados. Reconhece o mesmo serviço ainda pendente para permitir nova seleção. Isso não equivale à deduplicação dos vínculos persistidos.

O script PowerShell transforma um `worker.js` 0.4.0 anterior, identificado pelo SHA-256 `4cb838ffa28a2bdc3fa176e9e25c75e528f2b52a88a8937693e2db734f5f6e95`. Ele inclui a preparação da pesquisa, mas depende do worker original para confirmar CNPJ, selecionar a linha e preencher/conferir os demais campos. O manifesto e o relatório não contêm esse código. Portanto o script isolado não permite recuperar integralmente o worker 0.5.0.

O manifesto de teste possui `activeTab`, `scripting` e `downloads`. O manifesto atual 0.7.2 é do aplicativo de consulta PDF e permanece distinto; não o substituir pelo manifesto antigo.

## Próximos passos da implementação

### Estrutura visual esclarecida pelo usuário

A captura de tela posterior mostra o cadastro AR022 — Atividade econômica com navegação hierárquica à esquerda. O nó Serviços está expandido e contém um filho exibindo apenas percentual vazio e data. O formulário à direita possui Id 0, Serviço vazio, Data início preenchida, Data fim vazia e Especificar cnae? = Não. O botão Salvar(1) indica alteração pendente. Há também um nó separado Serviços herdados CNAE. Não inferir que a grade Wijmo detectada anteriormente seja a relação de vínculos; a leitura deverá mapear a árvore e os detalhes de cada vínculo, incluindo a distinção entre serviços diretos e herdados.

Falta observar um vínculo já salvo selecionado em Serviços para identificar como código, ID municipal e alíquota são apresentados. A imagem atual é de uma inclusão pendente e não estabelece ausência de outros vínculos. Não orientar salvar ou desfazer essa inclusão apenas para coletar diagnóstico. Não há seletores DOM da árvore confirmados pela captura.

A captura seguinte mostra a pasta Serviços selecionada e a grade de vínculos com seis linhas. Os cabeçalhos são ID, Serviço, Data início e Data fim. A árvore exibe os códigos 17.06.000, 13.01.000, 13.02.000, 17.22.000, 17.02.000 e 08.02.000; as descrições indicam 4%. O ID da grade é identificador do vínculo, distinto do ID do catálogo municipal. Cinco códigos têm correspondência única a 4% no catálogo recuperado. O código 13.01.000, descrito como (VETADO), não está nesse catálogo. Não excluir o vínculo nem presumir erro no cadastro por essa ausência.

`normalizarVinculosCenti` separa explicitamente `idVinculo` de `id` municipal e resolve código/alíquota pelo catálogo quando existe uma única correspondência ativa. Sem correspondência ou com ambiguidade, retorna identificação não resolvida; a conciliação bloqueia o preenchimento. Foram executados 14 testes, incluindo o cenário dos seis códigos e o vínculo ausente do catálogo. Ainda não há leitor DOM conectado nem verificação automática da empresa, completude, vigência ou serviços herdados. Não usar as linhas de uma captura como comprovação de leitura completa de todo o cadastro.

O usuário informou que não foi possível recuperar o worker antigo. A integração deverá ser reconstruída a partir das evidências disponíveis, sem depender desse arquivo. `tools/diagnostico-centi/` contém uma extensão separada para observar a estrutura visível da tela: não lê valores ou células, não clica, não preenche nem salva. Seus rótulos exportados pertencem a uma lista fixa; texto desconhecido é omitido. O manifesto do aplicativo PDF não foi modificado.

Para obter o mapa faltante: carregar a extensão de diagnóstico sem compactação, abrir a lista dos serviços já vinculados à empresa na Centi de Caetité, deixar a lupa fechada e clicar no ícone do diagnóstico. Enviar o JSON exportado na conversa. A leitura limita-se ao documento principal e não comprova completude de grades virtualizadas ou paginadas. A integração ativa ainda não foi implementada.

Validação local da ferramenta: cinco testes DOM com Playwright/Chromium passaram (`python tests/diagnostico-centi.py`), cobrindo privacidade, ausência de alterações/eventos, domínio/município incorreto, login visível, elementos ocultos e distinção entre lupa e lista. Esses testes executam a função de inspeção em páginas simuladas; não validam instalação, download pela extensão ou a tela real Centi. A conciliação continua com nove testes passando (`node --test tests/conciliacao.test.mjs`).

### Outros pacotes recuperados

Foram inspecionados também `PonteCenti-Consulta-5334bd60.zip` (versão 0.6.0, consulta BrasilAPI) e `PonteCenti-PDF-d56bcc52.zip` (versão 0.7.1, PDF com BrasilAPI alternativa). Ambos possuem exatamente o mesmo `worker.js` de 117 bytes da versão 0.7.2, que apenas abre `consulta.html`: não contêm a automação Centi. As bases JSON são iguais às atuais. O LEIA-ME da versão 0.6.0 declara explicitamente que a etapa de preenchimento 0.5.0 foi preservada separadamente.

As cópias extraídas estão fora do checkout, em `/workspace/recuperacao-ponte-centi/0.6.0/` e `/workspace/recuperacao-ponte-centi/0.7.1/`. A versão atual não foi substituída. Essas pastas locais não foram publicadas no GitHub.

1. Usar o diagnóstico para mapear a tela e reconstruir o adaptador; se o worker original aparecer posteriormente, preservá-lo como referência.
2. Mapear a tela/lista dos serviços vinculados à empresa, incluindo paginação, código, registro municipal, alíquota e identificação do CNPJ em edição.
3. Conectar a lista conferida ao adaptador Centi, verificar a empresa e ler todos os vínculos antes de chamar a conciliação.
4. Apresentar já cadastrados, pendentes e conflitos; não preencher enquanto a leitura estiver incompleta ou houver conflito.
5. Integrar a busca e seleção já testadas aos serviços pendentes, com nova leitura para evitar duplicidade entre operações. Manter o salvamento manual nesta etapa, preservando o comportamento anteriormente testado.

`conciliacao.mjs` e seus nove testes já preparam a comparação dos dados normalizados. A integração com a tela ainda não está implementada.


## Comparação 0.11.1 validada pelo operador

O relatório comparacao-centi-1792421644811.json confirmou reconhecimento real do serviço 09.02.000 no vínculo 16192 pela referência municipal numérica. Quatro serviços da lista estão localizados; apenas 10.03.000/51/4% não foi localizado na captura. A tentativa de pesquisar esse segundo serviço parou antes de interação porque o formulário novo não estava aberto. Não recomendar nova inclusão do primeiro serviço nem atualização para repetir essa comparação; preparar o formulário do segundo conforme o procedimento existente.


## Seleção real do segundo serviço confirmada

O relatório comparacao-centi-1792426021171.json confirmou seleção automática 10.03.000/51/4%, ID e descrição conferidos, datas preservadas (19/10/2026 e fim vazio), vínculo novo Id 0 e nenhum salvamento. A captura de comparação no relatório precede a seleção; não confundir seu nao_localizado com falha da etapa posterior bem-sucedida. Falta conferir Especificar CNAE no formulário, eventual salvamento manual e releitura final da lista para confirmar os cinco serviços localizados. Não repetir a seleção do segundo vínculo.


## Resultado final do caso real

O relatório comparacao-centi-1792426509098.json confirmou os cinco serviços selecionados como localizados: 08.02.000, 09.02.000, 10.03.000, 13.02.000 e 17.06.000. Os dois novos vínculos aparecem com IDs definitivos 16192 e 16198, respectivamente. Há oito vínculos com ID na captura, zero pendentes identificados e zero linhas não interpretadas. A lista não deve mais oferecer serviços para nova inclusão. Não repetir as inclusões ou salvamentos.

O teste desse caso está concluído: comparação, seleção assistida, salvamento manual e releitura com reconhecimento dos registros. O programa não salvou automaticamente. O vínculo histórico (VETADO) continua sinalizado sem correspondência no catálogo. O sucesso cobre os cinco serviços selecionados; não comprova correspondências completas de todos os CNAEs, ausência em páginas/filtros/herança ou validação de todos os cadastros.

Correção 0.14.2: o mapa real mostrou Atividade econômica em div.sidebarSubItens sem role/onclick. Esse controle agora é reconhecido pelo rótulo exato; com submenu visível, não procura Arrecadação antes. A continuidade ainda precisa de validação na Centi real.

0.14.3: o novo mapa parou em navegarServicosCenti ao confirmar Serviços, já selecionado na árvore. A navegação usa o divTreeSelected observado e cabeçalhos visíveis como o leitor. Mapa v3/falhaLocalizacao incluem estrutura das grades, cabeçalhos conhecidos, contagem de linhas e etapa de espera; não copiam dados das células. A continuidade ainda depende de validação real.

0.14.4: o mapa v3 confirmou que os cabeçalhos de data não estavam renderizados na espera, embora aparecessem depois. A identificação/leitura agora aceita metadados e getCellData da API pública Wijmo, sem depender da renderização de todas as colunas. Mantém bloqueio por coluna ausente/ambiguidade e fallback DOM completo. A captura indica origemLeitura e continua parcial quanto a paginação, filtros e herança. Mapa v4 registra metadados da API, sem valores de células.

0.14.5: bloqueio real antes de qualquer clique por Salvar coberto. Agora espera transições/hit-test, rola o botão à vista e confere sufixo do btnFooterSalvar. Aba oculta pode solicitar ativação; a interface só ativa e reconfere se salvo=false e salvamentoAcionado=false explícitos. Não ignora cobertura persistente nem repete resultado incerto. Mapa inclui falhaCadastro/diagnosticoSalvar. Preservar e retomar o vínculo já preenchido, sem Novo. Persistência automática real ainda precisa ser observada.

0.14.6: o novo diagnóstico do hit-test apontou Desfazer em vez do botão Salvar identificado no formulário, antes de qualquer clique. Para btnFooterSalvar com sufixo exato do formulário validado, usa o acionamento DOM nativo do próprio botão. Não depende de coordenadas nem aciona Desfazer. Mantém bloqueios de diálogo, modal persistente, inert, desabilitação e tentativa já enviada. Botões genéricos conservam hit-test. Ainda requer observação real da persistência/ID/releitura.

0.14.7: outra empresa tinha Serviços vazio, confirmado pelo operador, e API sem linhas/colunas; a navegação antiga bloqueava por ausência de cabeçalhos. Agora reconhece contexto Serviços + grade de coleção conhecida + fonte/itens vazios estáveis, sem carregamento ativo/total positivo. Retorna captura vazia válida e permite o primeiro Novo. Não considera fonte ausente como prova de ausência, nem afirma cobertura de herança/páginas. Validação real desse novo caso ainda pendente.
