# PocketBase Setup

## Primeira vez (VPS ou local)

### 1. Subir o container

Execute `docker compose up -d pocketbase`. O container já cria o superuser automaticamente usando as variáveis `PB_ADMIN_EMAIL` e `PB_ADMIN_PASSWORD` do `.env`.

> Em produção, troque essas credenciais no `.env` antes de subir.

---

### 2. Criar a collection `project_images`

Acesse o painel admin em `http://<seu-servidor>:8090/_/` e faça login com as credenciais do `.env`.

1. No menu lateral, clique em **Collections**
2. Clique em **+ New collection**
3. Defina o nome como `project_images` e o tipo como **Base**
4. Adicione os campos abaixo:

   | Nome | Tipo | Obrigatório | Opções |
   |------|------|-------------|--------|
   | `file` | File | Sim | Max size: 10 MB, Max select: 1 |
   | `projectId` | Text | Sim | — |

5. Na aba **API Rules**, deixe apenas **View** em branco (as imagens precisam ser acessíveis publicamente para exibição). **List**, **Create**, **Update** e **Delete** devem ser `null` — apenas o servidor faz essas operações
6. Clique em **Save**

---

### 3. Verificar

A collection `project_images` deve aparecer na lista. A partir daí a aplicação já está pronta para fazer uploads.

---

## Resetar (apagar dados)

Para começar do zero, derrube os containers, remova o volume `puaforgeai_pocketbase` e suba o container novamente. Depois repita o passo 2.
