---
name: dcastro.spec-technical
description: Gera spec tecnico de uma feature (arquitetura, dados, componentes, rotas, migrations)
---

Ler antes de qualquer coisa:
- `CLAUDE.md`
- `.claude/rules/workflow.md`
- `.claude/rules/migrations.md`
- `.claude/specs/architecture.md`
- `.claude/specs/<feature>/functional.md`

Feature a especificar: $ARGUMENTS

## Etapas

1. Verificar se `functional.md` existe com status `APROVADO`. Se nao, abortar e avisar.

2. Criar `.claude/specs/<feature>/technical.md` com:
   - Status: `RASCUNHO`
   - Novos endpoints da API (metodo, rota, payload, resposta, erros)
   - Mudancas no schema do banco (novas tabelas, colunas, indices)
   - Se houver mudanca no schema: migration necessaria (mencionar regra de timestamp)
   - Novos arquivos frontend (caminho, responsabilidade)
   - Arquivos existentes a modificar
   - Novos atoms Jotai necessarios
   - Chaves i18n necessarias em PT e EN
   - Tabela de tratamento de erros (codigo, mensagem i18n)

3. Apresentar para aprovacao. Se aprovado: mudar status para `APROVADO`.

Regras:
- Seguir a arquitetura: hooks como controllers, handlers no backend
- Componentes usam apenas Flowbite React / lucide-react — sem libs novas sem justificativa
- HTTP sempre via src/services/api.ts
- Atoms sempre encapsulados em hooks
- Verificar se mudanca no schema requer migration antes de propor
