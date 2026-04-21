import { PackageCheck, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFiles } from '@/hooks/useFiles';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useApiCall, HttpMethod } from '@/hooks/useApiCall';
import JSZip from 'jszip';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';

export default function BuildDownloadButton({ menuItem = false }: { menuItem?: boolean }) {
  const { files } = useFiles();
  const { activeProjectId, activeProject } = useProjects();
  const { token } = useAuth();
  const { t } = useTranslation();

  const safeName = (activeProject?.name || 'puaforge-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '');

  const {
    loading,
    error,
    execute: build,
  } = useApiCall<{ projectId: string | null; files: Record<string, string> }, { html: string }>(
    HttpMethod.POST,
    '/api/publish',
  );

  const handleDownload = async () => {
    const result = await build({ projectId: activeProjectId, files }, { Authorization: `Bearer ${token}` });
    if (!result) return;

    const zip = new JSZip();
    zip.file('index.html', result.html);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}-build.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (menuItem) {
    return (
      <div className="flex flex-col">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 transition cursor-pointer"
        >
          {loading ?
            <Loader2 size={14} className="animate-spin" />
          : <PackageCheck size={14} className="text-forge-terracotta/60" />}
          {t('editor.build')}
        </button>
        {error && (
          <p className="flex items-center gap-1 px-3 pb-1 text-[11px] text-red-400">
            <AlertCircle size={11} />
            {t('editor.buildError')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Tooltip content={t('editor.buildTooltip')} side="bottom" align="right">
        <Button variant="secondary" size="xs" isLoading={loading} onClick={handleDownload} className="gap-1.5 text-xs">
          {loading ?
            <Loader2 size={14} className="animate-spin" />
          : <PackageCheck size={14} />}
          {t('editor.build')}
        </Button>
      </Tooltip>
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-400">
          <AlertCircle size={11} />
          {t('editor.buildError')}
        </p>
      )}
    </div>
  );
}
