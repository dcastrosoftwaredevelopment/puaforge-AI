import { useTranslation } from 'react-i18next'
import { saveLanguage, type Language } from '@/i18n'

export function useLanguage() {
  const { i18n } = useTranslation()
  const current = i18n.language as Language

  const toggle = () => {
    const next: Language = current === 'pt' ? 'en' : 'pt'
    i18n.changeLanguage(next)
    saveLanguage(next)
  }

  return { language: current, toggle }
}
