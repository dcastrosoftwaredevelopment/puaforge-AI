import { PackageCheck, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFiles } from '@/hooks/useFiles'
import { useProjects } from '@/hooks/useProjects'
import { useApiCall, HttpMethod } from '@/hooks/useApiCall'
import JSZip from 'jszip'
import Tooltip from '@/components/ui/Tooltip'

export default function BuildDownloadButton({ menuItem = false }: { menuItem?: boolean }) {
  const { files } = useFiles()
  const { activeProjectId, activeProject } = useProjects()
  const { t } = useTranslation()

  const safeName = (activeProject?.name || 'puaforge-project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')

  const { loading, execute: build } = useApiCall<
    { projectId: string | null; files: Record<string, string> },
    { html: string }
  >(HttpMethod.POST, '/api/publish')

  const handleDownload = async () => {
    const result = await build({ projectId: activeProjectId, files })
    if (!result) return

    const zip = new JSZip()
    zip.file('index.html', result.html)

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}-build.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  const button = (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={menuItem
        ? 'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 transition cursor-pointer'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default bg-bg-tertiary transition disabled:opacity-40 cursor-pointer'}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} className={menuItem ? 'text-forge-terracotta/60' : ''} />}
      {t('editor.build')}
    </button>
  )

  if (menuItem) return button

  return (
    <Tooltip content={t('editor.buildTooltip')} side="bottom" align="right">
      {button}
    </Tooltip>
  )
}
