import { useRef, useState } from 'react'
import { X, Globe, FileCode, Loader2, Upload, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSetAtom, useAtomValue } from 'jotai'
import { useTranslation } from 'react-i18next'
import {
  projectsAtom,
  activeProjectIdAtom,
  messagesAtom,
  filesAtom,
  projectImagesAtom,
  checkpointsAtom,
  pendingImportAtom,
  type Project,
} from '@/atoms'
import { depsAtom } from '@/hooks/useFiles'
import { authTokenAtom } from '@/atoms/authAtoms'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { generateProjectName } from '@/utils/projectNames'
import { api } from '@/services/api'

// Same logic as in useProjectImages — converts filename to JS identifier
function toExportName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return base
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(\d)/, '_$1')
}

function base64ToFile(base64: string, name: string, mediaType: string): File {
  const byteChars = atob(base64)
  const byteArray = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i)
  return new File([byteArray], name, { type: mediaType })
}

interface ImportedImage {
  originalUrl: string
  base64: string
  mediaType: string
  suggestedName: string
}

interface Props {
  onClose: () => void
}

type Tab = 'url' | 'file'
type Step = 'idle' | 'fetching' | 'uploading' | 'done' | 'error'

export default function ImportSiteModal({ onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useAtomValue(authTokenAtom)

  const setProjects = useSetAtom(projectsAtom)
  const setActiveProjectId = useSetAtom(activeProjectIdAtom)
  const setMessages = useSetAtom(messagesAtom)
  const setFiles = useSetAtom(filesAtom)
  const setDeps = useSetAtom(depsAtom)
  const setProjectImages = useSetAtom(projectImagesAtom)
  const setCheckpoints = useSetAtom(checkpointsAtom)
  const setPendingImport = useSetAtom(pendingImportAtom)

  const [tab, setTab] = useState<Tab>('url')
  const [url, setUrl] = useState('')
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('idle')
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined

  const handleFile = (file: File) => {
    if (file.name.endsWith('.html') || file.type === 'text/html') {
      setHtmlFile(file)
      setError(null)
    } else {
      setError(t('import.errorFileType'))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const canSubmit =
    step === 'idle' || step === 'error'
      ? tab === 'url' ? url.trim().length > 0 : htmlFile !== null
      : false

  const handleImport = async () => {
    if (!authHeaders) return
    setError(null)
    setStep('fetching')

    try {
      // 1. Fetch parsed HTML + images from backend
      let body: Record<string, string>
      if (tab === 'url') {
        body = { url: url.trim() }
      } else {
        const htmlContent = await htmlFile!.text()
        body = { htmlContent }
      }

      const { html, images } = await api.post<{ html: string; images: ImportedImage[] }>(
        '/api/import-site',
        body,
        authHeaders,
      )

      // 2. Create project via API (no navigation yet — we upload images first)
      const project: Project = {
        id: crypto.randomUUID(),
        name: generateProjectName(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await api.post('/api/projects', project, authHeaders)

      // 3. Prepare atoms
      setProjects((prev) => [project, ...prev])
      setActiveProjectId(project.id)
      setMessages([])
      setFiles(DEFAULT_FILES)
      setDeps({})
      setProjectImages([])
      setCheckpoints([])

      // 4. Upload images one by one
      const uploadedNames: string[] = []
      if (images.length > 0) {
        setStep('uploading')
        setUploadProgress({ current: 0, total: images.length })

        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          try {
            const file = base64ToFile(img.base64, img.suggestedName, img.mediaType)
            const formData = new FormData()
            formData.append('file', file)
            await api.upload(`/api/projects/${project.id}/images`, formData, authHeaders)
            uploadedNames.push(toExportName(img.suggestedName))
          } catch {
            // Skip images that fail to upload — not critical
          }
          setUploadProgress({ current: i + 1, total: images.length })
        }
      }

      // 5. Build AI prompt
      const MAX_HTML = 80_000
      const truncatedHtml = html.length > MAX_HTML
        ? html.slice(0, MAX_HTML) + '\n<!-- [truncated] -->'
        : html

      const imageSection = uploadedNames.length > 0
        ? `\nThe following images have been imported and are available via import from './assets/images':\n${uploadedNames.map((n) => `- ${n}`).join('\n')}\n`
        : ''

      const prompt = `Convert this HTML/CSS/JS into a React project using Tailwind CSS.

Rules:
- Split into components when it makes sense (Header, Hero, Section, Footer, etc.)
- Never use document.querySelector — use useState, useRef, useEffect instead
- Convert any JavaScript to React hooks and event handlers
- If there are external libraries (jQuery, Swiper, GSAP, etc.), use their npm equivalents
- Keep the visual result identical to the original
- Use Tailwind CSS classes for styling wherever possible${imageSection}
--- Original HTML ---
${truncatedHtml}`

      // 6. Store pending import — EditorView will auto-send after project loads
      setPendingImport({ projectId: project.id, prompt })

      setStep('done')

      // 7. Navigate to editor
      navigate(`/project/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.errorGeneric'))
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-bg-secondary border border-border-default rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-text-primary">{t('import.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tabs */}
          <div className="flex rounded-lg bg-bg-primary p-1 gap-1">
            <button
              onClick={() => { setTab('url'); setError(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                tab === 'url' ? 'bg-forge-terracotta text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Globe size={12} />
              {t('import.urlTab')}
            </button>
            <button
              onClick={() => { setTab('file'); setError(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                tab === 'file' ? 'bg-forge-terracotta text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <FileCode size={12} />
              {t('import.fileTab')}
            </button>
          </div>

          {/* URL input */}
          {tab === 'url' && (
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary">{t('import.urlLabel')}</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleImport()}
                placeholder={t('import.urlPlaceholder')}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-forge-terracotta/40 transition font-mono"
                disabled={step === 'fetching' || step === 'uploading'}
                autoFocus
              />
            </div>
          )}

          {/* File drop zone */}
          {tab === 'file' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                isDragOver
                  ? 'border-forge-terracotta/60 bg-forge-terracotta/5'
                  : 'border-border-subtle hover:border-border-default'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,text/html"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              {htmlFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-vibe-blue">
                  <FileCode size={16} />
                  {htmlFile.name}
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload size={20} className="mx-auto text-text-muted" />
                  <p className="text-xs text-text-secondary">{t('import.fileHint')}</p>
                  <p className="text-[10px] text-text-muted">.html</p>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {step === 'fetching' && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Loader2 size={13} className="animate-spin text-forge-terracotta" />
              {t('import.fetching')}
            </div>
          )}
          {step === 'uploading' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Loader2 size={13} className="animate-spin text-forge-terracotta" />
                {t('import.uploadingImages', { current: uploadProgress.current, total: uploadProgress.total })}
              </div>
              <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-forge-terracotta transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {step === 'done' && (
            <div className="flex items-center gap-2 text-xs text-vibe-blue">
              <CheckCircle2 size={13} />
              {t('import.done')}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Hint */}
          <p className="text-[10px] text-text-muted leading-relaxed">
            {t('import.hint')}
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleImport}
              disabled={!canSubmit || step === 'fetching' || step === 'uploading'}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-forge-terracotta/10 text-forge-terracotta border border-forge-terracotta/30 hover:bg-forge-terracotta/20 disabled:opacity-40 transition cursor-pointer"
            >
              {(step === 'fetching' || step === 'uploading') && <Loader2 size={13} className="animate-spin" />}
              {t('import.button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
