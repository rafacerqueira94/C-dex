Ponte Centi — cópia de recuperação de 19/10/2026

Versão: 0.11.2
Commit exato: 01f8419fd18cf318eef7ffb14701b52ff18f5867
Tag: progresso-2026-10-19

ARQUIVOS
- .bundle: repositório Git completo até o commit indicado, incluindo histórico.
- -codigo.zip: arquivos versionados desse mesmo commit, sem precisar de Git.
- SHA256SUMS.txt: hashes dos dois arquivos.

RECUPERAR SEM INTERNET, COM GIT
Na pasta que contém o bundle, execute:
git clone --branch progresso-2026-10-19 C-dex-progresso-2026-10-19.bundle C-dex-recuperado
cd C-dex-recuperado
git switch -c retomada

A clonagem da tag pode avisar sobre HEAD destacado; a segunda instrução de Git
cria a branch de trabalho. Confira o commit com git rev-parse HEAD.
Depois leia RETOMAR.md e o final de CONTEXTO.md.

RECUPERAR SEM GIT
Extraia C-dex-progresso-2026-10-19-codigo.zip em uma pasta nova.
Carregue essa pasta, que contém manifest.json, sem compactação no Chrome/Edge.
A cópia ZIP contém o aplicativo e os documentos; o histórico fica no bundle.

VALIDAR OS ARQUIVOS
Linux: sha256sum -c SHA256SUMS.txt
Windows PowerShell: Get-FileHash -Algorithm SHA256 -LiteralPath NOME-DO-ARQUIVO
Compare o resultado com SHA256SUMS.txt.

O bundle guarda objetos e referências Git, não credenciais ou sessões.
Este pacote não contém PDFs empresariais, anexos operacionais da conversa ou
estado do navegador. Guarde separadamente os seus documentos originais.
Baixe e mantenha uma cópia deste pacote fora do GitHub e da máquina cloud.
