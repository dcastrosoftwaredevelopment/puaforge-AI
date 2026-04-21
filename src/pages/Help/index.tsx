import { useTranslation } from 'react-i18next'
import { ExternalLink, Key, CheckCircle2 } from 'lucide-react'
import Sidebar, { SidebarMenuButton } from '@/components/home/Sidebar'
import Step from './components/Step'

const CONSOLE_URL = 'https://console.anthropic.com'
const API_KEYS_URL = 'https://console.anthropic.com/settings/keys'
const DOCS_URL = 'https://docs.anthropic.com/en/api/getting-started'

export default function Help() {
  const { t } = useTranslation()

  const featureKeys = [1, 2, 3, 4] as const

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-bg-secondary md:hidden">
          <SidebarMenuButton />
          <span className="text-sm font-medium text-text-primary">{t('sidebar.help')}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-6">
          <h1 className="text-lg font-semibold text-text-primary hidden md:block">{t('sidebar.help')}</h1>

          {/* API Key setup */}
          <section className="bg-bg-secondary border border-border-subtle rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2.5">
              <Key size={15} className="text-forge-terracotta" />
              <h2 className="text-sm font-semibold text-text-primary">{t('help.apiSetup_title')}</h2>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{t('help.apiSetup_intro')}</p>
            <div className="space-y-5">
              <Step
                number={1}
                title={t('help.apiSetup_step1_title')}
                desc={t('help.apiSetup_step1_desc')}
                link={CONSOLE_URL}
                linkLabel={t('help.apiSetup_step1_link')}
              />
              <Step
                number={2}
                title={t('help.apiSetup_step2_title')}
                desc={t('help.apiSetup_step2_desc')}
                link={API_KEYS_URL}
                linkLabel={t('help.apiSetup_step2_link')}
              />
              <Step
                number={3}
                title={t('help.apiSetup_step3_title')}
                desc={t('help.apiSetup_step3_desc')}
              />
            </div>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition"
            >
              {t('help.apiSetup_docsLink')}
              <ExternalLink size={11} />
            </a>
          </section>

          {/* Features */}
          <section className="bg-bg-secondary border border-border-subtle rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-forge-terracotta" />
              <h2 className="text-sm font-semibold text-text-primary">{t('help.features_title')}</h2>
            </div>
            <div className="space-y-5 divide-y divide-border-subtle">
              {featureKeys.map((n) => (
                <div key={n} className="space-y-1 pt-4 first:pt-0 first:border-t-0">
                  <p className="text-xs font-semibold text-text-primary">{t(`help.features_${n}_title`)}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{t(`help.features_${n}_desc`)}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
