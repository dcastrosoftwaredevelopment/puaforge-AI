# Regras de Migrations (Drizzle ORM)

## Como criar uma migration

1. Rodar `npm run db:generate` para gerar o arquivo SQL a partir do schema
2. Verificar o arquivo gerado em `server/migrations/`
3. Verificar o `server/migrations/meta/_journal.json`

---

## Regra critica: timestamp do journal

O campo `when` de cada entrada no `_journal.json` DEVE ser maior que o `when` da migration anterior.

Drizzle usa `created_at` (que vem do `when`) para detectar migrations pendentes.
Se o `when` for menor que o da migration anterior, o Drizzle silenciosamente ignora a migration
e retorna "done" sem aplica-la. Isso causa inconsistencia entre schema e banco em producao.

SEMPRE verificar antes de commitar:

```bash
node --input-type=module -e "
import fs from 'fs';
const j = JSON.parse(fs.readFileSync('server/migrations/meta/_journal.json','utf8'));
const entries = j.entries;
let ok = true;
for (let i = 1; i < entries.length; i++) {
  if (entries[i].when <= entries[i-1].when) {
    console.error('ERRO: timestamp fora de ordem em idx', entries[i].idx, '(', entries[i].tag, ')');
    console.error('  when:', entries[i].when, '<= anterior:', entries[i-1].when);
    ok = false;
  }
}
if (ok) console.log('OK: todos os timestamps em ordem crescente');
"
```

Se estiver fora de ordem: editar manualmente o `when` da migration nova para ser
maior que o `when` da ultima migration. Usar `Date.now()` como referencia.

---

## Aplicar migrations em producao

Migrations rodam automaticamente no startup do server via `runMigrations()` em `server/db.ts`.

Se por algum motivo nao aplicarem automaticamente, usar o script de emergencia:

```bash
node scripts/apply-pending-migrations.mjs
```

O script e idempotente (usa IF NOT EXISTS em todos os statements).

---

## Verificar estado das migrations

Para ver quais migrations estao rastreadas no banco:

```bash
node --input-type=module -e "import pg from 'pg'; const pool = new pg.Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT||5432), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME }); const {rows} = await pool.query('SELECT count(*) FROM public.__drizzle_migrations'); console.log('migrations tracked:', rows[0].count); await pool.end();"
```

O numero deve ser igual ao total de entradas no `_journal.json`.
