import { atom } from 'jotai'

// Project
export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export const projectsAtom = atom<Project[]>([])
export const activeProjectIdAtom = atom<string | null>(null)

// Messages (scoped to active project)
export interface MessageImage {
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  images?: MessageImage[]
}

export const messagesAtom = atom<Message[]>([])

// Project files fed to Sandpack
export const filesAtom = atom<Record<string, string>>({
  '/App.tsx': `export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0e0f16] text-[#e2e8f0] font-sans">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-[#f1f5f9] mb-3">
          Vibe Platform
        </h1>
        <p className="text-lg text-[#64748b]">
          Descreva o que deseja construir no chat...
        </p>
      </div>
    </div>
  )
}`,
})

// Project images (reusable assets)
export interface ProjectImage {
  id: string
  name: string
  dataUrl: string
  mediaType: string
  size: number
}

export const projectImagesAtom = atom<ProjectImage[]>([])

// Checkpoints
export interface Checkpoint {
  id: string
  name: string
  files: Record<string, string>
  createdAt: number
}

export const checkpointsAtom = atom<Checkpoint[]>([])

// UI state
export const isChatOpenAtom = atom(true)
export const isGeneratingAtom = atom(false)
export const activeFileAtom = atom('/App.tsx')

// Chat mode
export type ChatMode = 'floating' | 'docked'
export const chatModeAtom = atom<ChatMode>('docked')

// View mode
export type ViewMode = 'editor' | 'preview' | 'split'
export const viewModeAtom = atom<ViewMode>('preview')

// Claude model selection
export interface ClaudeModel {
  id: string
  name: string
}

export const availableModelsAtom = atom<ClaudeModel[]>([])
export const selectedModelAtom = atom('')

// Editor dirty state (user has unsaved manual edits)
export const editorDirtyAtom = atom(false)
export const editorActionsAtom = atom<{ save: () => void; discard: () => void }>({
  save: () => {},
  discard: () => {},
})

// Device preview
export type DevicePreview = 'desktop' | 'tablet' | 'mobile'
export const devicePreviewAtom = atom<DevicePreview>('desktop')
