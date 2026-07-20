# Regras de Workflow

## Feature Branch

Ao receber qualquer solicitacao de nova feature, SEMPRE criar uma feature branch antes de qualquer codigo.
Convencao: `feature/<nome>` a partir da `main`.

---

## Merge

NUNCA fazer merge na main sem aprovacao explicita do usuario. NUNCA.

Fluxo obrigatorio:
1. Implementar na feature branch
2. Commitar e fazer push
3. Avisar que esta pronto para testar
4. PARAR e aguardar
5. O usuario testa e pede o merge explicitamente
6. Somente entao fazer o merge

Exemplos de pedido de merge: "faz o merge", "pode mergear", "merge", "manda para main", "fecha a feature"
NAO sao pedido de merge: "funcionou", "ficou bom", "gostei", "proxima feature"

---

## Commits

Nunca incluir "Co-Authored-By" no commit message.
Mensagens em ingles, formato conventional commits (feat/fix/chore/refactor/docs).

---

## Idioma

Todas as respostas e explicacoes no chat devem ser em portugues (pt-BR).
Codigo, commits e arquivos de configuracao permanecem em ingles.
