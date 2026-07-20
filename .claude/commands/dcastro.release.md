---
name: dcastro.release
description: Gera release — bump de versao, CHANGELOG e tag git
---

Versao ou flag: $ARGUMENTS
(Ex: `1.1.0`, `--minor`, `--major`, ou vazio para patch)

## Etapas

### 1 — Validacao
```bash
git status --short
git branch --show-current
```
- Nao esta na `main` → abortar
- Ha arquivos nao commitados → abortar

### 2 — Determinar versao
```bash
node -e "console.log(require('./package.json').version)"
```
- Argumento explicito → usar
- `--minor` → bump minor, zerar patch
- `--major` → bump major, zerar minor e patch
- Sem argumento → bump patch

Confirmar com usuario antes de continuar.

### 3 — Bump de versao
- `package.json`: campo `version`

### 4 — Gerar CHANGELOG.md
Commits desde ultima tag:
```bash
git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline --no-merges
```

Inserir no topo do CHANGELOG.md:
```
## [X.Y.Z] - YYYY-MM-DD

### Features
- (commits feat:)

### Bug Fixes
- (commits fix:)

### Other
- (demais, exceto chore: de bump)
```

### 5 — Commit
```bash
git add package.json CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
```

### 6 — Tag
```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
```

### 7 — Resumo
Exibir:
- Versao aplicada
- Tag criada
- CHANGELOG atualizado
- Lembrar de fazer push da tag: `git push origin vX.Y.Z`

Regras:
- Nunca fazer push automaticamente
- Se qualquer etapa falhar, parar e reportar
