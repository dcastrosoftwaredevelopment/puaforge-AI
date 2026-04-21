import { useTranslation } from 'react-i18next';
import { ExternalLink, Key } from 'lucide-react';
import Step from './Step';

const CONSOLE_URL = 'https://console.anthropic.com';
const API_KEYS_URL = 'https://console.anthropic.com/settings/keys';
const DOCS_URL = 'https://docs.anthropic.com/en/api/getting-started';

export default function ApiSetupSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-bg-secondary border border-border-subtle rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <Key size={15} className="text-forge-terracotta" />
        <h2 className="text-sm font-semibold text-text-primary">{t('help.apiSetup_title')}</h2>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">{t('help.apiSetup_intro')}</p>
      <div className="space-y-5">
        <Step number={1} title={t('help.apiSetup_step1_title')} desc={t('help.apiSetup_step1_desc')} link={CONSOLE_URL} linkLabel={t('help.apiSetup_step1_link')} />
        <Step number={2} title={t('help.apiSetup_step2_title')} desc={t('help.apiSetup_step2_desc')} link={API_KEYS_URL} linkLabel={t('help.apiSetup_step2_link')} />
        <Step number={3} title={t('help.apiSetup_step3_title')} desc={t('help.apiSetup_step3_desc')} />
      </div>
      <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition">
        {t('help.apiSetup_docsLink')}
        <ExternalLink size={11} />
      </a>
    </section>
  );
}
