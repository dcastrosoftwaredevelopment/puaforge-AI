import { useState, useRef } from 'react'
import { Save, RotateCcw, Trash2, Pencil, Check, X } from 'lucide-react'
import { useCheckpoints } from '@/hooks/useCheckpoints'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CheckpointRow({ checkpoint, onRestore, onDelete, onRename }: {
  checkpoint: { id: string; name: string; files: Record<string, string>; createdAt: number }
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = () => {
    setEditValue(checkpoint.name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const confirmRename = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== checkpoint.name) {
      onRename(checkpoint.id, trimmed)
    }
    setEditing(false)
  }

  const fileCount = Object.keys(checkpoint.files).length

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary border border-border-subtle group">
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="flex-1 min-w-0 text-xs bg-bg-elevated border border-border-default rounded px-1.5 py-0.5 text-text-primary outline-none focus:border-accent"
              autoFocus
            />
            <button onClick={confirmRename} className="p-0.5 text-success hover:text-green-400 transition cursor-pointer">
              <Check size={11} />
            </button>
            <button onClick={() => setEditing(false)} className="p-0.5 text-text-muted hover:text-text-primary transition cursor-pointer">
              <X size={11} />
            </button>
          </div>
        ) : (
          <p
            className="text-xs text-text-primary truncate cursor-pointer hover:text-accent transition"
            onDoubleClick={startEditing}
            title="Duplo-clique para renomear"
          >
            {checkpoint.name}
          </p>
        )}
        <p className="text-[10px] text-text-muted">
          {formatDate(checkpoint.createdAt)} &middot; {fileCount} arquivo{fileCount !== 1 ? 's' : ''}
        </p>
      </div>
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onRestore(checkpoint.id)}
            className="p-1 rounded text-text-muted hover:text-accent transition cursor-pointer"
            title="Restaurar"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={startEditing}
            className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
            title="Renomear"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(checkpoint.id)}
            className="p-1 rounded text-text-muted hover:text-red-400 transition cursor-pointer"
            title="Excluir"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function Checkpoints() {
  const { checkpoints, createCheckpoint, restoreCheckpoint, deleteCheckpoint, renameCheckpoint } = useCheckpoints()
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleCreate = () => {
    createCheckpoint(newName)
    setNewName('')
    setShowInput(false)
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">Checkpoints</span>
        {showInput ? (
          <div className="flex items-center gap-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setShowInput(false)
              }}
              placeholder="Nome do checkpoint..."
              className="w-36 text-xs bg-bg-elevated border border-border-default rounded px-2 py-1 text-text-primary outline-none focus:border-accent placeholder-text-muted"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="p-1 rounded text-success hover:text-green-400 transition cursor-pointer"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => setShowInput(false)}
              className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle rounded-md transition cursor-pointer"
          >
            <Save size={12} />
            Salvar
          </button>
        )}
      </div>

      {checkpoints.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">
          Salve checkpoints para poder restaurar versões anteriores
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {checkpoints.map((cp) => (
            <CheckpointRow
              key={cp.id}
              checkpoint={cp}
              onRestore={restoreCheckpoint}
              onDelete={deleteCheckpoint}
              onRename={renameCheckpoint}
            />
          ))}
        </div>
      )}
    </div>
  )
}
