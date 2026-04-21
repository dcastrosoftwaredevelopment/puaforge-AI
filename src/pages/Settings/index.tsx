import { Key, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import Sidebar, { SidebarMenuButton } from '@/components/sidebar/Sidebar';
import Button from '@/components/ui/Button';

export default function Settings() {
  const { t } = useTranslation();
  const {
    apiKey,
    draft,
    setDraft,
    showKey,
    setShowKey,
    validated,
    validating,
    validationError,
    hasChanges,
    apiKeyEnabled,
    handleValidate,
    handleSave,
    handleClear,
    handleToggleEnabled,
  } = useSettingsForm();

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle md:hidden">
          <SidebarMenuButton />
          <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ height: '20px', width: 'auto' }} />
        </div>
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{t('settings.title')}</h1>
            <p className="text-sm text-text-muted mt-1">{t('settings.subtitle')}</p>
          </div>

          {/* API Key Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Key size={16} className="text-forge-terracotta" />
                <h2 className="text-base font-semibold text-text-primary">{t('settings.apiKeySection')}</h2>
              </div>
              {apiKey && (
                <button
                  onClick={handleToggleEnabled}
                  className={`relative w-9 h-5 rounded-full transition cursor-pointer ${
                    apiKeyEnabled ? 'bg-accent' : 'bg-bg-elevated border border-border-subtle'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg-primary transition-transform ${
                      apiKeyEnabled ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
              )}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
              {t('settings.apiKeyDescription')}
            </p>

            {apiKey && !apiKeyEnabled && (
              <div className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
                {t('settings.apiKeyDisabledWarning')}
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                  }}
                  placeholder={t('settings.apiKeyPlaceholder')}
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-default transition font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition cursor-pointer"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {validated === true && (
                <div className="flex items-center gap-2 text-xs text-vibe-blue">
                  <CheckCircle2 size={13} />
                  {t('settings.apiKeyValid')}
                </div>
              )}
              {validated === false && (
                <div className="flex items-center gap-2 text-xs text-forge-terracotta">
                  <XCircle size={13} />
                  {validationError || t('settings.apiKeyInvalid')}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={validating}
                  onClick={handleValidate}
                  disabled={!draft.trim()}
                >
                  {t('settings.validate')}
                </Button>
                <Button variant="blue" size="sm" isLoading={validating} onClick={handleSave} disabled={!hasChanges}>
                  {t('settings.save')}
                </Button>
                {apiKey && (
                  <Button variant="terracotta" size="sm" onClick={handleClear}>
                    {t('settings.remove')}
                  </Button>
                )}
              </div>

              {apiKey && !hasChanges && apiKeyEnabled && (
                <p className="text-xs text-text-muted">{t('settings.apiKeyActive')}</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
