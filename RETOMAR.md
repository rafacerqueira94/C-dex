# Como retomar e recuperar o Ponte Centi

Ponto de recuperação: **progresso-2026-10-19**. Código no marco: **0.11.2**. Desenvolvimento atual: **0.14.3** (entrada pelo PDF, passagem interna sem JSON e cadastro sequencial com salvamento/releitura; nova automação ainda sem validação real).

## Onde o projeto está salvo

- Repositório: https://github.com/rafacerqueira94/C-dex
- Desenvolvimento: branch `main`.
- Este ponto específico: tag `progresso-2026-10-19`.
- Cópia completa com histórico: branch `backup/progresso-2026-10-19`, pasta `backups/`.
- Contexto detalhado: `CONTEXTO.md`. Guia operacional: `docs/COMPARACAO-CENTI.md`.

O código, as bibliotecas incorporadas, as bases JSON, os testes e as instruções estão versionados. O backup Git inclui todo o histórico de commits disponível neste repositório, inclusive os ajustes da integração. Não depende da existência desta conversa ou do diretório temporário original.

Para ter uma cópia independente do GitHub e do ambiente, baixe o ZIP da branch de backup e guarde-o também no seu computador ou em um armazenamento sob seu controle. Uma tag identifica uma versão; não substitui essa cópia independente.

## Estado validado

- Cartão CNPJ em PDF → conferência → lista JSON → comparação na Centi.
- Os cinco serviços selecionados do caso de teste foram localizados após a inclusão dos dois que não apareciam inicialmente.
- A pesquisa, a seleção pela API pública Wijmo e a ativação por clique foram validadas na Centi real para `09.02.000 / 238 / 4%` e `10.03.000 / 51 / 4%`.
- O operador salvou manualmente; a releitura localizou esses vínculos com IDs definitivos `16192` e `16198`.
- O relatório final encontrou oito vínculos com ID, zero pendentes identificados e zero linhas não interpretadas. Nenhum dos cinco serviços da lista deve ser oferecido para nova inclusão nesse caso.
- O vínculo histórico `(VETADO)` permanece separado para revisão, sem correspondência no catálogo atual.

Não repetir essas inclusões para refazer o teste. A versão validada 0.11.2 não aciona Salvar. A 0.12.0 acrescenta salvamento após revisão, com testes simulados; ainda falta validação real dessa nova ação. A leitura é parcial: não comprova cobertura de todos os CNAEs, paginação, filtros, herança ou vigência. O CNPJ é confirmado pelo operador. Especificar CNAE foi conferido visualmente no caso concluído; a identificação automática desse campo na 0.12.0 ainda precisa de validação real. O contexto e o palácio de memória originais não foram encontrados: `CONTEXTO.md` foi reconstruído e mantido durante esta recuperação.

## Abrir o aplicativo

1. Baixe o código pelo GitHub ou extraia o ZIP de código da pasta `backups/`.
2. No Chrome/Edge, abra Extensões, ative o modo do desenvolvedor e carregue sem compactação a pasta que contém o `manifest.json` principal.
3. Na aba `https://ba.centi.com.br/caetite/`, com a empresa e a tabela Serviços abertas, clique no ícone: ele abre a importação do PDF já vinculada à aba Centi. Depois de conferir, use Continuar para cadastrar na Centi; não é preciso transportar JSON. Fora da Centi, o ícone abre apenas a consulta sem aba conectada.
4. Para comparar, a tabela da pasta Serviços deve estar visível, com a lupa e o formulário de vínculo fechados. Abra um vínculo novo somente depois da comparação pronta.

O operador não precisa de Node.js, servidor ou instalação npm. PDF.js e suas fontes já estão incorporados. O projeto recuperado não contém package.json, lockfile ou scripts npm originais; não presumir que os comandos npm citados em versões antigas existam.

## Retomar o desenvolvimento

Em tarefas cloud, usar o checkout já existente em `/workspace/C-dex`. Cada tarefa é isolada; não criar worktree sem pedido explícito.

Leia primeiro este arquivo e o final de `CONTEXTO.md`, pois as seções anteriores preservam a história de versões. A última comparação do caso foi concluída; não reiniciar testes de inclusão no mesmo cadastro sem uma nova necessidade explícita.

As verificações usadas durante o desenvolvimento foram:

```sh
node --test tests/conciliacao.test.mjs tests/comparar-captura.test.mjs tests/worker.test.mjs tests/cadastrar-servicos.test.mjs
python tests/ler-vinculos-centi.py
python tests/pesquisar-servico-centi.py
python tests/integracao-ui.py
python tests/salvar-servico-centi.py
python tests/navegar-servicos-centi.py
python tests/fluxo-pdf-ui.py
```

Os testes Python usam Playwright e Chromium, já disponíveis na máquina cloud onde o projeto foi preparado. Não há manifesto de dependências Python no projeto; uma máquina nova precisa disponibilizá-los para executar esses testes. O aplicativo empacotado não depende deles.

## Recuperar com GitHub

Para obter o projeto atual em uma pasta nova:

```sh
git clone https://github.com/rafacerqueira94/C-dex.git
```

Para trabalhar a partir deste ponto específico, dentro do clone:

```sh
git switch -c recuperacao-2026-10-19 progresso-2026-10-19
```

Isso cria uma branch a partir da versão salva, sem apagar a evolução posterior de main. Se essa branch local já existir, escolha outro nome.

## Recuperar sem internet pelo backup completo

A pasta `backups/` da branch de backup contém o arquivo `.bundle` com o histórico Git, o ZIP do código e os SHA-256. O README dessa pasta registra o commit exato e os comandos específicos de recuperação. O bundle pode ser clonado como um repositório local, sem acessar o GitHub.

O bundle preserva objetos e referências Git, não credenciais/configurações locais. O backup de código contém apenas arquivos versionados do projeto. PDFs de empresas, relatórios operacionais enviados nesta conversa, estado do navegador e sessões autenticadas não são parte desse backup; mantenha seus originais no armazenamento que você controla.

## Preservar o trabalho daqui para frente

Antes de encerrar uma etapa: verificar `git status`, revisar as mudanças, fazer commit, enviar ao GitHub e confirmar o SHA remoto. Atualizar `CONTEXTO.md` com validações e limitações. Para marcos importantes, criar uma nova tag e um novo bundle/ZIP sem sobrescrever os anteriores. Não guardar a única cópia em `/tmp` ou na conversa.

## Fluxo atual 0.13.0

A finalidade explicitada pelo usuário é importar o cartão CNPJ da empresa atual, filtrar serviços, adicionar e salvar na Centi. Não retornar ao roteiro de exigir exportar/importar JSON entre as etapas. O ícone na Centi abre consulta.html?aba=ID; a lista conferida passa na mesma aba por sessionStorage, vinculada à aba Centi, com prazo de 30 minutos e consumo único. A integração recebe o CNPJ do PDF, bloqueado para edição. Após comparar e autorizar a conferência de empresa/ausência fora da captura, Adicionar e salvar na Centi executa a fila em cadastrar-servicos.mjs. Novo/lista usam navegar-servicos-centi.mjs; pesquisa/seleção reaproveitam o módulo validado; persistência exige ID definitivo mais correspondência na releitura antes do próximo item. Falhas interrompem a fila, preservam relatório em ultimoCadastro e não repetem salvamento incerto.

As novas navegações e salvamento ainda dependem de validação na Centi real; o teste completo usa um PDF real sintético e ações Chrome simuladas. A revisão da empresa, heranças/páginas/filtros e de outras alterações pendentes continua manual. O modo avançado por JSON em integracao.html permanece compatível, mas não é a entrada padrão.

## Bloqueio mais recente e retomada

A tentativa real 0.13.0 chegou ao salvamento, mas bloqueou por Especificar CNAE não identificado; nenhum Salvar foi acionado. Não recriar o vínculo pendente 07.02.000. A 0.13.1 amplia a associação por título/grupo do campo e inclui Continuar um vínculo já preenchido no fluxo PDF. Essa rota confere o formulário e permite salvar sem Novo ou pesquisa. Se persistir o bloqueio, solicitar Baixar comparação com diagnosticoCnae; o DOM real desse campo ainda não foi recebido.

## Entrada independente da aba Centi — 0.14.0

O usuário definiu que pode iniciar com a Centi fechada; somente o login deve depender dele. conectar-centi.mjs abre/reutiliza aba, preserva a lista importada e detecta a tela de login por leitura estrutural, sem manipular senhas. O manifest passa a solicitar host_permissions apenas para https://ba.centi.com.br/caetite/*, necessário para operar sem o clique ativo nessa aba.

O percurso fornecido pelo usuário é Arrecadação → Atividade econômica → Cadastros / Atividade econômica AR022 → filtro CPF/CNPJ / Contendo / CNPJ do PDF → Pesquisar → dois cliques na linha exata → Serviços → comparar → Novo para ausentes. pesquisar-empresa-centi.mjs e abrir-empresa-centi.mjs implementam isso por controles únicos, atualização observada e CNPJ/ID exatos. A identificação automática de empresa só é marcada após cruzar resultado da pesquisa e ID do cadastro. Em sucesso, compara e continua a fila autorizada pelo botão Iniciar cadastro automático, sem as preparações manuais anteriores.

O percurso novo passou por testes simulados; ainda requer validação real de DOM e interação. Não afirmar automação completa validada nem ausência de duplicidades fora da captura. A leitura de páginas/herança permanece limitada. Não abandonar pendências; preservá-las e oferecer retomada. Permitir exportar mapa-conexao-centi.json se a navegação bloquear. Testes adicionais: node --test tests/conectar-centi.test.mjs; python tests/pesquisar-empresa-centi.py.

## Diagnóstico da navegação 0.14.1

O mapa v1 enviado tinha AR022 visível mas não registrava ancestrais do cartão nem falha da localização e podia ser anterior à tentativa. O cartão AR022 agora aceita div/li de texto exato e o mapa v2 é lido de novo ao baixar, com ancestrais estruturais e função/etapa da falha. Não afirmar correção real só pelo mapa antigo.

O mapa real seguinte confirmou submenu em div.sidebarSubItens com span Atividade econômica, ignorado pelo seletor, causando procura indevida de Arrecadação. A 0.14.2 inclui essa classe específica nos controles de navegação; não ampliar para qualquer div de texto semelhante.

Último mapa: pesquisa/abertura da empresa avançaram, mas navegarServicosCenti expirou ao confirmar a lista. Serviços aparece em div.divTreeSelected / rowTree.normalRowTree.row. A 0.14.3 clica nesse controle, alinha visibilidade de cabeçalhos ao leitor e inclui grades/cabeçalhos e etapa exata no mapa v3. Ainda falta confirmar o DOM da grade real; não inferir ausência de serviços ou sucesso de salvamento desse mapa.
