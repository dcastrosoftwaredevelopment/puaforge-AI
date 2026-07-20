# Arquitetura

## Stack

- Frontend: React 19 + TypeScript + Vite + Tailwind + Flowbite React
- Estado global: Jotai (atoms em src/atoms/)
- i18n: react-i18next (locales em src/i18n/locales/)
- Backend: Express 5 + TypeScript + tsx
- ORM: Drizzle + PostgreSQL
- Deploy: Docker (multi-stage build)

## Frontend — Estrutura de camadas

```
src/
  atoms/         — estado global Jotai (nunca importar direto em componentes)
  hooks/         — controllers: toda logica, efeitos, handlers e chamadas HTTP
  pages/         — paginas (pasta com index.tsx + components/)
  components/    — componentes compartilhados
  services/      — api.ts (unico ponto de chamadas HTTP)
  utils/         — funcoes puras utilitarias
  i18n/locales/  — pt.ts (define o tipo Translations) e en.ts
```

Regra central: componentes sao Views puras — chamam um hook e mapeiam para JSX.
Estado, efeitos e handlers vivem no hook correspondente (useXxx).

## Backend — Estrutura de camadas

```
server/
  routes/      — wiring: metodo + path + middleware + handler (1 linha por rota)
  handlers/    — logica de negocio por dominio (domainHandlers.ts)
  middleware/  — auth, etc.
  services/    — integrações externas (email, storage, etc.)
  migrations/  — SQL gerado pelo Drizzle
  schema.ts    — definicao das tabelas
  db.ts        — conexao e runMigrations()
```

## Banco de dados

PostgreSQL. Migrations via Drizzle ORM.
Rodam automaticamente no startup do server via runMigrations().
Ver .claude/rules/migrations.md para regras de timestamp do journal.

## Deploy

Docker multi-stage. O Dockerfile copia server/ e scripts/ para a imagem de producao.
Migrations rodam automaticamente ao iniciar o container.
