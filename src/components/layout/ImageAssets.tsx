import { useRef, useState } from 'react'
import { ImagePlus, Trash2, Copy, Pencil, Check, X } from 'lucide-react'
import { useProjectImages } from '@/hooks/useProjectImages'

function toExportName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return base
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(\d)/, '_$1')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}

function ImageRow({ img, onRename, onCopy, onRemove }: {
  img: { id: string; name: string; dataUrl: string; size: number }
  onRename: (id: string, name: string) => void
  onCopy: (name: string) => void
  onRemove: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = () => {
    setEditValue(baseName(img.name))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const confirmRename = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== baseName(img.name)) {
      onRename(img.id, trimmed)
    }
    setEditing(false)
  }

  const cancelRename = () => setEditing(false)

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary border border-border-subtle group">
      <img
        src={img.dataUrl}
        alt={img.name}
        className="w-10 h-10 rounded object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename()
                if (e.key === 'Escape') cancelRename()
              }}
              className="flex-1 min-w-0 text-xs bg-bg-elevated border border-border-default rounded px-1.5 py-0.5 text-text-primary outline-none focus:border-accent"
              autoFocus
            />
            <button onClick={confirmRename} className="p-0.5 text-success hover:text-green-400 transition cursor-pointer">
              <Check size={11} />
            </button>
            <button onClick={cancelRename} className="p-0.5 text-text-muted hover:text-text-primary transition cursor-pointer">
              <X size={11} />
            </button>
          </div>
        ) : (
          <p
            className="text-xs text-text-primary truncate cursor-pointer hover:text-accent transition"
            onDoubleClick={startEditing}
            title="Duplo-clique para renomear"
          >
            {img.name}
          </p>
        )}
        <p className="text-[10px] text-text-muted">{formatSize(img.size)}</p>
      </div>
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={startEditing}
            className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
            title="Renomear"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onCopy(img.name)}
            className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
            title="Copiar import"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => onRemove(img.id)}
            className="p-1 rounded text-text-muted hover:text-red-400 transition cursor-pointer"
            title="Remover imagem"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function ImageAssets() {
  const { images, addImage, renameImage, removeImage } = useProjectImages()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await addImage(file)
      }
    }
  }

  const copyImport = (name: string) => {
    const exportName = toExportName(name)
    navigator.clipboard.writeText(`import { ${exportName} } from './assets/images'`)
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">Imagens do projeto</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle rounded-md transition cursor-pointer"
        >
          <ImagePlus size={12} />
          Upload
        </button>
      </div>

      {images.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">
          Faça upload de imagens para usar no seu site
        </p>
      ) : (
        <div className="space-y-2">
          {images.map((img) => (
            <ImageRow
              key={img.id}
              img={img}
              onRename={renameImage}
              onCopy={copyImport}
              onRemove={removeImage}
            />
          ))}
        </div>
      )}
    </div>
  )
}
