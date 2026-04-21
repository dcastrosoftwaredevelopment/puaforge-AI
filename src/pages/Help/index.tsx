import { useTranslation } from 'react-i18next';
import Sidebar, { SidebarMenuButton } from '@/components/sidebar/Sidebar';
import ApiSetupSection from './components/ApiSetupSection';
import FeaturesSection from './components/FeaturesSection';

export default function Help() {
  const { t } = useTranslation();

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
          <ApiSetupSection />
          <FeaturesSection />
        </main>
      </div>
    </div>
  );
}
