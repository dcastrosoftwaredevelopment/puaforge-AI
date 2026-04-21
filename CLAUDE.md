# Project Rules

## i18n

All user-visible text must use `useTranslation` from `react-i18next`. Never hardcode UI strings.

- Add translation keys to both `src/i18n/locales/pt.ts` and `src/i18n/locales/en.ts`
- `pt.ts` defines the `Translations` type — `en.ts` must satisfy it
- Use `const { t } = useTranslation()` inside each component (not at module level)
- For JSX with inline styled elements, use the `Trans` component from `react-i18next`
- For date formatting, use `i18n.language === 'pt' ? 'pt-BR' : 'en-US'` as the locale
- For plurals, use the `_one` / `_other` suffix convention (e.g. `count_one`, `count_other`)
- Non-React functions that produce user-visible error messages must use i18n keys as error message strings; translate them with `t(err.message)` in the calling component

## State management

Jotai atoms must never be imported directly in components or pages. Always wrap them in a custom hook in `src/hooks/`.

- Create a dedicated hook for any new atom before using it in a component
- Global atoms live in `src/atoms/index.ts` or `src/atoms/authAtoms.ts`; never create atoms at hook module scope

## HTTP requests

HTTP calls must never occur directly in components or pages. Always use or create a hook in `src/hooks/` that delegates to `src/services/api.ts`.

## UI components

Prioritize Flowbite React components for all new frontend work. Before writing custom JSX for buttons, modals, drawers, tooltips, inputs, progress bars, dropdowns, or any other UI primitive, check if Flowbite React has a suitable component.

- Buttons with text or a loading state → always use `<Button>` from `src/components/ui/Button.tsx` (variants: `primary`, `secondary`, `blue`, `ghost`, `danger`, `terracotta`)
- Modals → `Modal` + `ModalBody` from `flowbite-react`
- Tooltips → `src/components/ui/Tooltip.tsx` (wraps Flowbite, keeps `side`/`align` API)
- Inputs → Flowbite `TextInput` with `color="failure"` for error states
- Progress bars → Flowbite `Progress`
- Drawers → Flowbite `Drawer`
- Raw `<button>` is acceptable only for: icon-only tight-layout buttons, tab-style groups with active state that doesn't map to existing variants, or elements with unique hover colors with no matching variant
- Never hardcode button styles inline when a variant already covers the case

## Hooks as controllers (frontend)

Hooks are the "controller" layer; components are pure "views".

- All state (`useState`), side-effects (`useEffect`), handlers (`handleX`), and API calls belong in a custom hook in `src/hooks/`
- A component file must not declare `useState`, `useEffect`, or handler functions directly — it only calls a hook and maps the returned values to JSX
- Acceptable exception: purely local visual state with no side-effects (e.g. `isOpen` for a tooltip that never leaves the component)
- Name the hook after the component it drives: `EditorHeader` → `useEditorHeader`, `LoginForm` → `useLoginForm`

## One component per file (frontend)

- Each `.tsx` file exports exactly one component
- **`src/components/`**: exclusive sub-components live as siblings in the same domain folder
  (e.g. `layout/CheckpointRow.tsx` alongside `layout/Checkpoints.tsx`)
- **`src/pages/`**: each page uses the folder pattern — `PageName/index.tsx`; exclusive
  sub-components go in `PageName/components/SubComponent.tsx`
- Pure utility functions (formatDate, formatBytes, etc.) go in `src/utils/`, never inside a component file

## Handler layer (backend)

Route files are wiring only — method + path + middleware + handler call.

- Business logic (DB queries, validation, error handling) goes in a named exported function in `server/handlers/<domain>Handlers.ts`
- Route callbacks must be a single line: `router.post('/path', requireAuth, handler)`
- Helpers shared across handlers in the same domain stay in the same handlers file
