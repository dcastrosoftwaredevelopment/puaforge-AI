import { PackageCheck, Loader2 } from 'lucide-react'
import { useFiles } from '@/hooks/useFiles'
import { useProjects } from '@/hooks/useProjects'
import { useApiCall, HttpMethod } from '@/hooks/useApiCall'
import JSZip from 'jszip'
import Tooltip from '@/components/ui/Tooltip'

export default function BuildDownloadButton() {
  const { files } = useFiles()
  const { activeProjectId, activeProject } = useProjects()

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

  return (
    <Tooltip content="Gerar e baixar o build pronto para deploy" side="bottom" align="right">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default bg-bg-tertiary transition disabled:opacity-40 cursor-pointer"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
        Build
      </button>
    </Tooltip>
  )
}
