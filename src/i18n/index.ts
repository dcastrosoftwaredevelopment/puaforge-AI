import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { pt } from './locales/pt'
import { en } from './locales/en'

export type Language = 'pt' | 'en'

const STORAGE_KEY = 'puaforge_language'

export function getSavedLanguage(): Language {
  return (localStorage.getItem(STORAGE_KEY) as Language) ?? 'pt'
}

export function saveLanguage(lang: Language) {
  localStorage.setItem(STORAGE_KEY, lang)
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
