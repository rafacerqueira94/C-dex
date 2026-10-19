# Como retomar e recuperar o Ponte Centi

Ponto de recuperação: **progresso-2026-10-19**. Código da extensão: **0.11.2**.

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

Não repetir essas inclusões para refazer o teste. O programa não aciona Salvar automaticamente. A leitura é parcial: não comprova cobertura de todos os CNAEs, paginação, filtros, herança ou vigência. O CNPJ é confirmado pelo operador. Especificar CNAE foi conferido visualmente no teste; não é lido automaticamente. O contexto e o palácio de memória originais não foram encontrados: `CONTEXTO.md` foi reconstruído e mantido durante esta recuperação.

## Abrir o aplicativo

1. Baixe o código pelo GitHub ou extraia o ZIP de código da pasta `backups/`.
2. No Chrome/Edge, abra Extensões, ative o modo do desenvolvedor e carregue sem compactação a pasta que contém o `manifest.json` principal.
3. Clique no ícone fora da Centi para abrir a leitura PDF. Na aba `https://ba.centi.com.br/caetite/`, o ícone abre a comparação.
4. Para comparar, a tabela da pasta Serviços deve estar visível, com a lupa e o formulário de vínculo fechados. Abra um vínculo novo somente depois da comparação pronta.

O operador não precisa de Node.js, servidor ou instalação npm. PDF.js e suas fontes já estão incorporados. O projeto recuperado não contém package.json, lockfile ou scripts npm originais; não presumir que os comandos npm citados em versões antigas existam.

## Retomar o desenvolvimento

Em tarefas cloud, usar o checkout já existente em `/workspace/C-dex`. Cada tarefa é isolada; não criar worktree sem pedido explícito.

Leia primeiro este arquivo e o final de `CONTEXTO.md`, pois as seções anteriores preservam a história de versões. A última comparação do caso foi concluída; não reiniciar testes de inclusão no mesmo cadastro sem uma nova necessidade explícita.

As verificações usadas durante o desenvolvimento foram:

```sh
node --test tests/conciliacao.test.mjs tests/comparar-captura.test.mjs tests/worker.test.mjs
python tests/ler-vinculos-centi.py
python tests/pesquisar-servico-centi.py
python tests/integracao-ui.py
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
