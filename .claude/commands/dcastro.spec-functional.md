---
name: dcastro.spec-functional
description: Gera spec funcional de uma feature (user stories, criterios de aceitacao)
---

Ler antes de qualquer coisa:
- `CLAUDE.md`
- `.claude/rules/workflow.md`
- `.claude/specs/architecture.md`

Feature a especificar: $ARGUMENTS

## Etapas

1. Verificar se ja existe `.claude/specs/<feature>/functional.md`. Se sim, perguntar se quer reescrever.

2. Se a feature nao foi descrita em detalhes suficientes, fazer perguntas:
   - Quem usa e o que precisa fazer?
   - Quais casos de erro importam?
   - Ha restricoes de plano/permissao/performance?

3. Criar `.claude/specs/<feature>/functional.md` com:
   - Status: `RASCUNHO`
   - Objetivo em uma frase
   - User stories: "Como X, quero Y, para Z"
   - Criterios de aceitacao por user story (checkboxes)
   - Casos fora do escopo

4. Apresentar o conteudo e aguardar aprovacao.
   - Se aprovado: mudar status para `APROVADO`
   - Se precisar de ajustes: iterar

Regras:
- Sem detalhes tecnicos — apenas o que o usuario ve e faz
- Sem mencionar componentes, hooks, rotas ou arquivos de codigo
