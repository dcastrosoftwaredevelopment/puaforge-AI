---
name: dcastro.implement
description: Implementa uma feature executando as tasks do plano aprovado
---

Ler antes de qualquer coisa:
- `CLAUDE.md`
- `.claude/rules/workflow.md`
- `.claude/rules/migrations.md`
- `.claude/specs/architecture.md`
- `.claude/specs/<feature>/functional.md`
- `.claude/specs/<feature>/technical.md`
- `.claude/specs/<feature>/tasks.md`

Feature a implementar: $ARGUMENTS

## Etapas

1. Verificar que `tasks.md` existe com status `PENDENTE`. Se nao, abortar.

2. Criar feature branch:
   ```bash
   git checkout main && git checkout -b feature/<feature>
   ```
   Atualizar `tasks.md`: status `PENDENTE` -> `EM ANDAMENTO`

3. Executar tasks na ordem recomendada. Para cada task:
   - Implementar seguindo CLAUDE.md
   - Se a task cria uma migration: verificar timestamp do journal antes de commitar
     (ver `.claude/rules/migrations.md`)
   - Rodar lint:
     ```bash
     npm run lint
     ```
   - Commitar:
     ```
     feat(<feature>): <descricao da task>
     ```
   - Marcar task como `concluida` em `tasks.md`

4. Instalar dependencias quando necessario:
   ```bash
   npm install <deps>
   ```

5. Atualizar documentacao na ultima task:
   - `CLAUDE.md`: adicionar nova feature se relevante
   - `.claude/specs/architecture.md`: se houver mudanca de arquitetura ou modelo de dados
   - `functional.md` e `technical.md`: status -> `IMPLEMENTADO`
   - `tasks.md`: status -> `CONCLUIDO`
   - Commitar atualizacoes de doc separado

6. Relatorio final:
   - Tasks concluidas
   - Como testar
   - Aguardar `/dcastro.verify` antes do merge

Regras:
- Seguir CLAUDE.md em tudo
- Zero erros de lint antes de cada commit
- NUNCA fazer merge automaticamente
