# Comparação com a Centi — versão 0.10.2

## Instalação

Baixe o ZIP do repositório e extraia. No Chrome/Edge, abra Extensões, ative o modo do desenvolvedor e carregue sem compactação a pasta **C-dex-main**, que contém o manifesto principal 0.10.2. Esta é a aplicação completa; não selecionar `tools/diagnostico-centi`, que continua sendo a ferramenta separada 0.2.0. Ao atualizar uma pasta já carregada, recarregue a extensão e confira a versão exibida. A versão 0.10.2 requer activeTab e scripting para ler a aba Centi após o clique no ícone.

## Usar

1. Gere e baixe a lista conferida da empresa pelo fluxo PDF do Ponte Centi. Para abrir esse fluxo, clique no ícone da extensão a partir de uma aba que não seja a Centi.
2. Na Centi de Caetité, abra a mesma empresa e selecione a pasta Serviços, exibindo a tabela com ID, Serviço, Data início e Data fim. Deixe o formulário de vínculo e a lupa fechados.
3. Nessa aba Centi, clique no ícone do **Ponte Centi** (aplicativo completo, versão 0.10.2). Será aberta uma nova aba de comparação; mantenha a aba Centi aberta. Se ainda tiver apenas o PDF, use o link **Gerar lista conferida a partir do PDF**; ele abre a consulta em outra aba, preservando a comparação.
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

A versão 0.10.2 preserva a pré-seleção conferida, procura o elemento sob o centro da célula e envia a sequência de cliques e duplo clique a esse elemento interno. Interrompe eventos adicionais se a lupa fechar ou se a seleção mudar. O relatório registra o alvo e os eventos enviados. Esses eventos continuam sintéticos; os testes não provam que a Centi real os processará.

Para conferir a escolha feita pelo operador:

1. Faça a comparação e mantenha o serviço esperado selecionado no Ponte Centi.
2. Na Centi, escolha a linha exata manualmente. Para o teste observado: ID **238**, código **09.02.000**, alíquota **4,00** (não a linha 740 / 5%). Dê o duplo clique e aguarde voltar ao formulário do vínculo novo Id 0, sem salvar.
3. Na aba Ponte Centi, clique em **Conferir seleção manual — sem salvar**. Esse botão não exige a confirmação de Serviço vazio, pois agora ele deve estar preenchido; usa a confirmação de empresa da comparação.
4. A conferência apenas lê ID/código e descrição do Serviço e as datas do formulário; não envia cliques, não pesquisa e não altera campos. Recusa serviço diferente, vínculo já salvo ou lupa ainda aberta. A origem da seleção é registrada como **operador**, e não como automação.
5. Se houver datas anteriores registradas da mesma tentativa, compara-as; caso contrário, `datasPreservadas` é null, não uma confirmação de preservação. A validação de Especificar CNAE e demais regras continua manual.
6. Baixe a comparação para registrar os campos conferidos. O vínculo continua não salvo.

Passaram 16 testes DOM da pesquisa/seleção/conferência e 10 UI com API Chrome simulada nesta etapa. O teste com elemento interno exige dois cliques antes do duplo clique; os testes manuais verificam ausência de alterações, serviço incorreto, lupa aberta e comparação de datas. A nova ativação automática e a conferência manual ainda dependem da validação do operador na Centi real.
