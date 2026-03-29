import { useRef, useState, type KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Send, ImagePlus, X } from 'lucide-react'
import { type MessageImage } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { useMessages } from '@/hooks/useMessages'
import { useModels } from '@/hooks/useModels'
import { useEditorState } from '@/hooks/useEditorState'
import { useApiKey } from '@/hooks/useApiKey'
import { generateCode } from '@/services/aiService'
import { mergeFiles, extractDependencies } from '@/services/fileParser'
import { useProjectImages } from '@/hooks/useProjectImages'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_BASE64_BYTES = 5 * 1024 * 1024 // 5MB — limite da API do Claude
const MAX_DIMENSION = 2048

function compressImage(file: File): Promise<{ base64: string; mediaType: MessageImage['mediaType'] }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      // Redimensionar se necessário
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // Tentar qualidade progressiva até caber em 5MB
      let quality = 0.9
      let dataUrl = ''
      while (quality > 0.1) {
        dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]
        if (base64.length * 0.75 <= MAX_BASE64_BYTES) {
          resolve({ base64, mediaType: 'image/jpeg' })
          return
        }
        quality -= 0.1
      }
      reject(new Error('Imagem muito grande, mesmo após compressão'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Erro ao carregar imagem'))
    }
    img.src = url
  })
}

function fileToMessageImage(file: File): Promise<MessageImage> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error('Tipo de imagem não suportado'))
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      // Se já cabe em 5MB, usa direto
      if (base64.length * 0.75 <= MAX_BASE64_BYTES) {
        resolve({ base64, mediaType: file.type as MessageImage['mediaType'] })
        return
      }
      // Senão, comprimir via canvas
      try {
        const compressed = await compressImage(file)
        resolve(compressed)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler imagem'))
    reader.readAsDataURL(file)
  })
}

export default function PromptInput() {
  const [prompt, setPrompt] = useState('')
  const [pendingImages, setPendingImages] = useState<MessageImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const { messages, setMessages, isGenerating, setIsGenerating } = useMessages()
  const { files, setFiles, setDeps } = useFiles()
  const { selectedModel } = useModels()
  const { isDirty } = useEditorState()
  const { effectiveApiKey } = useApiKey()
  const { getImagesContext } = useProjectImages()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setImageError(null)
    try {
      const newImages = await Promise.all(selectedFiles.map(fileToMessageImage))
      setPendingImages((prev) => [...prev, ...newImages])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar imagem'
      setImageError(msg)
      setTimeout(() => setImageError(null), 4000)
    }
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    const text = prompt.trim()
    if ((!text && pendingImages.length === 0) || isGenerating || isDirty) return

    const images = pendingImages.length > 0 ? [...pendingImages] : undefined
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: text || '(imagem enviada)',
      timestamp: Date.now(),
      images,
    }
    setMessages((prev) => [...prev, userMsg])
    setPrompt('')
    setPendingImages([])
    setIsGenerating(true)

    try {
      const imagesCtx = getImagesContext()
      const fullPrompt = imagesCtx
        ? `${text || 'Analise esta imagem e crie o layout correspondente.'}\n\n${imagesCtx}`
        : (text || 'Analise esta imagem e crie o layout correspondente.')

      const result = await generateCode({
        prompt: fullPrompt,
        model: selectedModel,
        currentFiles: files,
        history: messages.map((m) => ({ role: m.role, content: m.content, images: m.images })),
        images,
        apiKey: effectiveApiKey || undefined,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.rawResponse,
          timestamp: Date.now(),
        },
      ])

      if (Object.keys(result.files).length > 0) {
        const merged = mergeFiles(files, result.files)
        setFiles(merged)

        const newDeps = extractDependencies(merged)
        if (Object.keys(newDeps).length > 0) {
          console.log('[PromptInput] Detected dependencies:', newDeps)
          setDeps((prev) => ({ ...prev, ...newDeps }))
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Erro ao gerar código. Tente novamente.',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isDisabled = isGenerating || isDirty

  return (
    <div className="space-y-2">
      {isDirty && (
        <div className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
          Você está editando o código. Salve ou descarte as alterações no editor para voltar a usar a IA.
        </div>
      )}
      {imageError && (
        <div className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
          {imageError}
        </div>
      )}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={`data:${img.mediaType};base64,${img.base64}`}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg border border-border-subtle"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <X size={10} className="text-text-muted" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <TextareaAutosize
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={4}
          maxRows={8}
          className="w-full bg-bg-tertiary border border-border-subtle rounded-xl p-3 pr-20 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-border-default transition"
          placeholder="Descreva o que deseja construir..."
          disabled={isDisabled}
        />
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            className="p-1.5 rounded-lg bg-bg-elevated text-text-muted border border-border-subtle hover:text-forge-terracotta hover:border-forge-terracotta/30 disabled:opacity-20 transition cursor-pointer"
            title="Enviar imagem"
          >
            <ImagePlus size={14} />
          </button>
          <button
            onClick={handleSend}
            disabled={isDisabled || (!prompt.trim() && pendingImages.length === 0)}
            className="p-1.5 rounded-lg bg-forge-terracotta/10 text-forge-terracotta border border-forge-terracotta/30 hover:bg-forge-terracotta/20 disabled:opacity-20 transition cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
