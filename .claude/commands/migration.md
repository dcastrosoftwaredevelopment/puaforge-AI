---
name: migration
description: Cria e valida uma nova migration Drizzle com verificacao de timestamp
---

Feature/mudanca de schema: $ARGUMENTS

## Etapas

1. Atualizar `server/schema.ts` com as mudancas necessarias.

2. Rodar o generate:
   ```bash
   npm run db:generate
   ```

3. Verificar o arquivo SQL gerado em `server/migrations/` — confirmar que os statements estao corretos.

4. Verificar os timestamps do journal (regra critica):
   ```bash
   node --input-type=module -e "import fs from 'fs'; const j = JSON.parse(fs.readFileSync('server/migrations/meta/_journal.json','utf8')); const e = j.entries; let ok = true; for (let i = 1; i < e.length; i++) { if (e[i].when <= e[i-1].when) { console.error('ERRO timestamp fora de ordem: idx', e[i].idx, e[i].tag); ok = false; } } if (ok) console.log('OK: timestamps em ordem');"
   ```

   Se ERRO: editar `_journal.json` e corrigir o `when` da nova migration para ser maior que o anterior.
   Usar `Date.now()` como valor.

5. Commitar os arquivos gerados:
   - `server/schema.ts`
   - `server/migrations/<nova_migration>.sql`
   - `server/migrations/meta/_journal.json`
   - `server/migrations/meta/<snapshot>.json` (se gerado)

6. Informar ao usuario que a migration sera aplicada automaticamente no proximo deploy/restart do server.
