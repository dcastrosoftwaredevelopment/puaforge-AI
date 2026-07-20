---
name: dcastro.start
description: Orquestra o fluxo completo de uma feature — spec funcional, tecnico, plan, implement e verify
---

Feature a desenvolver: $ARGUMENTS

Executar as fases em sequencia, pausando para aprovacao do usuario em cada uma.

---

## Fase 1 — Spec Funcional

Invocar `/dcastro.spec-functional $ARGUMENTS` e seguir todas as suas instrucoes.

Ao final perguntar:
> "Spec funcional gerado. Aprovar para continuar para o spec tecnico?"

Aguardar resposta. Nao avancar sem aprovacao explicita.

---

## Fase 2 — Spec Tecnico

Invocar `/dcastro.spec-technical $ARGUMENTS` e seguir todas as suas instrucoes.

Ao final perguntar:
> "Spec tecnico gerado. Aprovar para continuar para o planejamento de tasks?"

Aguardar resposta. Nao avancar sem aprovacao explicita.

---

## Fase 3 — Planejamento

Invocar `/dcastro.plan $ARGUMENTS` e seguir todas as suas instrucoes.

Ao final perguntar:
> "Tasks planejadas. Confirmar para iniciar a implementacao?"

Aguardar resposta. Nao implementar nada sem confirmacao.

---

## Fase 4 — Implementacao

Invocar `/dcastro.implement $ARGUMENTS` e seguir todas as suas instrucoes.

Ao final informar:
> "Implementacao concluida. Deseja rodar a verificacao agora?"

---

## Fase 5 — Verificacao

Se o usuario confirmar: invocar `/dcastro.verify $ARGUMENTS`.

Quando o usuario reportar que tudo passou: lembrar que o merge so acontece com pedido explicito.

---

## Regras

- NUNCA pular uma fase
- NUNCA avancar sem aprovacao explicita
- NUNCA fazer merge automaticamente
