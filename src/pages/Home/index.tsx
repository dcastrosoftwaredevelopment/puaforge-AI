import { useEffect, useState, useCallback } from 'react';

declare const __APP_DOMAIN__: string;
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectActions } from '@/hooks/useProjectActions';
import Sidebar, { SidebarMenuButton } from '@/components/sidebar/Sidebar';
import EmptyState from './components/EmptyState';
import ProjectCard from './components/ProjectCard';
import Button from '@/components/ui/Button';

export default function Home() {
  const { projects } = useProjects();
  const { createProject, openProject, deleteProject, fetchPublishedIds } = useProjectActions();
  const { token } = useAuth();
  const { t } = useTranslation();
  interface PublishedInfo { projectId: string; subdomain: string | null; customDomain: string | null }
  const [publishedMap, setPublishedMap] = useState<Map<string, PublishedInfo>>(new Map());

  useEffect(() => {
    if (!token) return;
    fetchPublishedIds().then(setPublishedMap);
  }, [token, fetchPublishedIds]);

  const openPreview = useCallback((projectId: string) => {
    const info = publishedMap.get(projectId);
    if (!info) return;
    const url = info.customDomain
      ? `https://${info.customDomain}`
      : info.subdomain
        ? `https://${info.subdomain}.${__APP_DOMAIN__}`
        : null;
    if (url) window.open(url, '_blank');
  }, [publishedMap]);

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle md:hidden">
          <SidebarMenuButton />
          <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ height: '20px', width: 'auto' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-text-primary">{t('projects.title')}</h1>
              <p className="text-sm text-text-muted mt-1">
                {projects.length === 0
                  ? t('projects.emptyHint')
                  : t('projects.count', { count: projects.length })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="terracotta" size="md" onClick={createProject} className="gap-2">
                <Plus size={16} />
                <span className="hidden sm:inline">{t('projects.newProject')}</span>
              </Button>
            </div>
          </div>

          {projects.length === 0 ? (
            <EmptyState onCreate={createProject} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  hasPreview={publishedMap.has(project.id)}
                  onOpen={() => openProject(project.id)}
                  onDelete={() => deleteProject(project.id)}
                  onPreview={() => openPreview(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
