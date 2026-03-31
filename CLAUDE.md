# Project Rules

## i18n

All user-visible text must use `useTranslation` from `react-i18next`. Never hardcode UI strings.

- Add translation keys to both `src/i18n/locales/pt.ts` and `src/i18n/locales/en.ts`
- `pt.ts` defines the `Translations` type — `en.ts` must satisfy it
- Use `const { t } = useTranslation()` inside each component (not at module level)
- For JSX with inline styled elements, use the `Trans` component from `react-i18next`
- For date formatting, use `i18n.language === 'pt' ? 'pt-BR' : 'en-US'` as the locale
- For plurals, use the `_one` / `_other` suffix convention (e.g. `count_one`, `count_other`)
