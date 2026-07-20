# Regras de Estilo e Codigo

## Stack

- Frontend: React 19 + TypeScript + Vite + Tailwind + Flowbite React + Jotai + react-i18next
- Backend: Express + Drizzle ORM + PostgreSQL
- Deploy: Docker

---

## Estado (Jotai)

Atoms nunca importados diretamente em componentes ou pages.
Sempre encapsular em um custom hook em `src/hooks/`.
Atoms globais em `src/atoms/index.ts` ou `src/atoms/authAtoms.ts`.

---

## HTTP

Chamadas HTTP nunca diretamente em componentes ou pages.
Sempre usar ou criar hook em `src/hooks/` que delega para `src/services/api.ts`.

---

## Componentes (frontend)

Usar Flowbite React para primitivos de UI antes de escrever JSX customizado.
Botoes com texto ou loading -> `<Button>` de `src/components/ui/Button.tsx`.
Modais -> `Modal` + `ModalBody` do flowbite-react.

Um componente por arquivo `.tsx`.

---

## Hooks como controllers

Toda logica de estado, efeitos e handlers fica no hook, nao no componente.
Componente so chama o hook e mapeia para JSX.
Nomear o hook pelo componente que controla: `EditorHeader` -> `useEditorHeader`.

---

## i18n

Todo texto visivel ao usuario via `useTranslation`.
Nunca hardcodar strings de UI.
Adicionar chaves em `src/i18n/locales/pt.ts` e `src/i18n/locales/en.ts`.

---

## Backend (handlers)

Arquivos de rotas sao apenas wiring: metodo + path + middleware + handler.
Logica de negocio em `server/handlers/<domain>Handlers.ts`.
