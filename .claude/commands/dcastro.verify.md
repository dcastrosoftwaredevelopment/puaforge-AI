---
name: dcastro.verify
description: Gera checklist de verificacao baseado nos criterios de aceitacao da feature
---

Ler antes de qualquer coisa:
- `.claude/specs/<feature>/functional.md` (criterios de aceitacao)
- `.claude/specs/<feature>/technical.md` (casos de erro, endpoints)

Feature a verificar: $ARGUMENTS

## Etapas

1. Ler todos os criterios de aceitacao do `functional.md` e casos de erro do `technical.md`.

2. Exibir no chat um checklist testavel (nao criar arquivo):

```
VERIFICACAO: <feature>

Funcionalidade principal:
[ ] <criterio 1>
[ ] <criterio 2>
...

Casos de erro:
[ ] <caso 1>
[ ] <caso 2>
...

Regressao:
[ ] Features existentes continuam funcionando
[ ] npm run lint -- zero erros
[ ] App carrega sem erro no console do browser
[ ] API responde corretamente nos endpoints novos
```

3. Aguardar resultado do usuario.
   - Se tudo ok: usuario solicita merge explicitamente
   - Se houver falhas: corrigir na mesma branch, usuario re-verifica

Nao fazer merge. Apenas apresentar checklist e aguardar.
