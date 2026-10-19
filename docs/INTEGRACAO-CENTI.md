# Integração Centi — evidências recuperadas

## Implementação atual

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
