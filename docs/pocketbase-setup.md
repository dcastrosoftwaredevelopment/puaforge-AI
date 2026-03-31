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

### 3. Criar a collection `published_sites`

1. Clique em **+ New collection**
2. Defina o nome como `published_sites` e o tipo como **Base**
3. Adicione os campos abaixo:

   | Nome | Tipo | Obrigatório | Opções |
   |------|------|-------------|--------|
   | `html` | File | Sim | Max size: 5 MB, Max select: 1 |
   | `projectId` | Text | Sim | — |

4. Na aba **API Rules**, deixe **todas as regras como `null`** — apenas o servidor acessa esta collection via admin token
5. Clique em **Save**

> Esta collection armazena os HTMLs publicados. Cada publicação cria um novo record — o Postgres guarda o ID do record mais recente, separando o domínio temporário (subdomain) do custom domain. Não é necessário alterar esta collection ao adicionar essa funcionalidade.

---

### 4. Verificar

As collections `project_images` e `published_sites` devem aparecer na lista. A partir daí a aplicação já está pronta para fazer uploads e publicações.

---

## Resetar (apagar dados)

Para começar do zero, derrube os containers, remova o volume `puaforgeai_pocketbase` e suba o container novamente. Depois repita os passos 2 e 3.
