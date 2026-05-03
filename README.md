# PuaForge AI

Plataforma de criação de sites com IA.

## Requisitos

- [Docker](https://www.docker.com/) e Docker Compose

## Subindo o ambiente

```bash
docker compose up
```

A aplicação sobe em `http://localhost:5173` e a API em `http://localhost:3001`.  
As migrations do banco são aplicadas automaticamente na inicialização do servidor.

---

## Seeds

### Super User

Registra um ou mais emails como Super User no banco. Se o email ainda não existir, cria um pré-cadastro; se já existir, promove o usuário existente.

```bash
docker compose exec app node scripts/seed-superuser.js seu@email.com
```

Após rodar o seed, faça login normalmente (Google OAuth ou email/senha). O Super User tem acesso à tela `/admin/users` para aprovar ou bloquear contas.

---

### Usuários de demonstração

Cria 6 usuários com email e senha, 2 por plano (free, indie, pro). Idempotente — pode rodar mais de uma vez sem duplicar.

```bash
docker compose exec app node scripts/seed-demo-users.js
```

**Senha de todos:** `Test1234!`

| Email | Plano |
|---|---|
| free1@test.com | free |
| free2@test.com | free |
| indie1@test.com | indie |
| indie2@test.com | indie |
| pro1@test.com | pro |
| pro2@test.com | pro |

> Atenção: esses usuários têm `status=active` e `email_verified=true`. Use apenas em ambientes de desenvolvimento.
