# Comparação com a Centi — versão 0.8.0

## Instalação

Baixe o ZIP do repositório e extraia. No Chrome/Edge, abra Extensões, ative o modo do desenvolvedor e carregue sem compactação a pasta **C-dex-main**, que contém o manifesto principal 0.8.0. Esta é a aplicação completa; não selecionar `tools/diagnostico-centi`, que continua sendo a ferramenta separada 0.2.0. Ao atualizar uma pasta já carregada, recarregue a extensão e confira a versão exibida. A versão 0.8.0 requer activeTab e scripting para ler a aba Centi após o clique no ícone.

## Usar

1. Gere e baixe a lista conferida da empresa pelo fluxo PDF do Ponte Centi. Para abrir esse fluxo, clique no ícone da extensão a partir de uma aba que não seja a Centi.
2. Na Centi de Caetité, abra a mesma empresa e selecione a pasta Serviços, exibindo a tabela com ID, Serviço, Data início e Data fim. Deixe o formulário de vínculo e a lupa fechados.
3. Nessa aba Centi, clique no ícone do **Ponte Centi** (aplicativo completo, versão 0.8.0). Será aberta uma nova aba de comparação; mantenha a aba Centi aberta.
4. Selecione o JSON da lista conferida. Informe o CNPJ que você verificou no cadastro da Centi e marque a confirmação da empresa.
5. Clique em Ler vínculos visíveis e comparar. A aplicação lê os vínculos renderizados na aba indicada e compara as descrições exatas normalizadas com o catálogo municipal. ID do vínculo e ID do catálogo são tratados separadamente.
6. Revise os resultados e, se necessário, clique em Baixar comparação. O JSON contém CNPJ confirmado pelo operador, dados dos serviços da lista e ID/descrição/datas dos vínculos lidos; compartilhe-o apenas se desejar que esses dados sejam analisados.

## Como interpretar

- **Localizado na captura:** há um vínculo identificado com o mesmo código, registro municipal e alíquota. Ainda é necessário conferir vigência.
- **Conflito:** foi identificado o mesmo código com outro registro/alíquota ou mais de um vínculo.
- **Não localizado nesta captura:** a leitura atual não encontrou correspondência. Isso não comprova ausência no cadastro nem autoriza nova inclusão.
- **Sem identificação:** descrição ausente ou ambígua no catálogo; inclui serviços históricos como o 13.01.000 (VETADO) da captura fornecida. Não excluir ou recadastrar automaticamente.

O aplicativo não clica em Novo, não preenche campos e não aciona Salvar. Não percorre páginas, não rola a grade e não lê serviços herdados automaticamente. O CNPJ é confirmado pelo operador, não detectado na página. O relatório é sempre parcial e retorna `podePreencher: false`.

## Validação

- `node --test tests/conciliacao.test.mjs tests/comparar-captura.test.mjs`: 21 testes passaram.
- `node --test tests/worker.test.mjs`: três testes da abertura do aplicativo passaram.
- `python tests/ler-vinculos-centi.py`: seis testes DOM com Playwright/Chromium passaram.
- `python tests/integracao-ui.py`: três testes da interface em navegador com API Chrome simulada passaram, incluindo importação, comparação, exportação e invalidação após alterar o CNPJ.

Os testes locais usam páginas simuladas. A instalação e a leitura pela extensão 0.8.0 na Centi real ainda precisam ser validadas pelo operador. O diagnóstico 0.2.0 fornecido pelo usuário confirmou cabeçalhos duplicados, cinco células por linha e sete linhas renderizadas, mas não seus conteúdos; não é prova de que exista uma cópia de medição específica na tela real. O leitor só unifica repetições com o mesmo ID de vínculo e os mesmos dados; IDs diferentes nunca são unificados.
