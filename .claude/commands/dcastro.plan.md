---
name: dcastro.plan
description: Quebra uma feature em tasks executaveis com dependencias e ordem de execucao
---

Ler antes de qualquer coisa:
- `.claude/specs/<feature>/functional.md`
- `.claude/specs/<feature>/technical.md`

Feature a planejar: $ARGUMENTS

## Etapas

1. Verificar se `functional.md` e `technical.md` existem com status `APROVADO`. Se nao, abortar.

2. Criar `.claude/specs/<feature>/tasks.md` com:
   - Status: `PENDENTE`
   - Lista de tasks (T-01, T-02, ...) cada uma com:
     - Titulo claro e acionavel
     - O que fazer (bullet points especificos)
     - Se ha migration: incluir task separada para criar e validar o timestamp
     - Status: `pendente`
   - Grafo de dependencias entre tasks
   - Ordem recomendada de execucao

3. Apresentar o plano ao usuario e aguardar confirmacao antes de prosseguir.

Criterios para uma boa task:
- Especifica o suficiente para saber quando esta feita
- Pequena o suficiente para ser commitada sozinha
- Independente quando possivel
- Tasks de banco (migration) sempre antes das tasks que dependem das novas colunas
