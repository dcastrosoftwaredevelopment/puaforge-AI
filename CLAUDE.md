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
