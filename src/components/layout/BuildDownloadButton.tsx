import { useState } from 'react'
import { PackageCheck, Loader2 } from 'lucide-react'
import { useFiles } from '@/hooks/useFiles'
import { useProjects } from '@/hooks/useProjects'
import JSZip from 'jszip'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function BuildDownloadButton() {
  const { files } = useFiles()
  const { activeProjectId, activeProject } = useProjects()
  const [loading, setLoading] = useState(false)

  const safeName = (activeProject?.name || 'vibe-project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProjectId, files }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao gerar build')
      }

      const { html } = await res.json()

      const zip = new JSZip()
      zip.file('index.html', html)

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${safeName}-build.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[build-download]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default bg-bg-tertiary transition disabled:opacity-40 cursor-pointer"
      title="Download do build pronto para deploy"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
      Build
    </button>
  )
}
