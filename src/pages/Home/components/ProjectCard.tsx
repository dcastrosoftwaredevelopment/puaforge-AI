import { Trash2, Globe, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Project } from '@/atoms';

interface ProjectCardProps {
  project: Project;
  hasPreview: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onShare?: () => void;
}

export default function ProjectCard({ project, hasPreview, onOpen, onDelete, onPreview, onShare }: ProjectCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <div
      onClick={onOpen}
      className="group relative bg-bg-secondary border border-border-subtle rounded-xl p-5 cursor-pointer hover:border-forge-terracotta/30 hover:bg-bg-elevated transition"
    >
      {project.sharedBy && (
        <span className="inline-block mb-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400">
          {t('projects.sharedBy', { name: project.sharedBy.name ?? project.sharedBy.email })}
        </span>
      )}

      <h3 className="text-sm font-medium text-text-primary mb-2 pr-8">{project.name}</h3>
      <p className="text-xs text-text-muted">
        {new Date(project.updatedAt).toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {hasPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-1.5 rounded-lg text-text-muted hover:text-forge-terracotta hover:bg-bg-primary transition"
            title={t('projects.openPreview')}
          >
            <Globe size={14} />
          </button>
        )}
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="p-1.5 rounded-lg text-text-muted hover:text-forge-terracotta hover:bg-bg-primary transition"
            title={t('projects.share')}
          >
            <Share2 size={14} />
          </button>
        )}
        {!project.sharedBy && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-text-muted hover:text-forge-terracotta hover:bg-bg-primary transition"
            title={t('projects.deleteProject')}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
