import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

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
export const filesAtom = atom<Record<string, string>>({})

// Project images (reusable assets)
export interface ProjectImage {
  id: string
  name: string
  url: string
  mediaType: string
  size: number
  /** Data URL fetched client-side for use in Sandpack preview (not persisted) */
  dataUrl?: string
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

// Panel sizes
export const editorFractionAtom = atom(0.5)
export const chatWidthAtom = atom(384)

// API key (configured via settings page)
export const apiKeyAtom = atom('')
export const apiKeyEnabledAtom = atom(true)

// Device preview
export type DevicePreview = 'desktop' | 'tablet' | 'mobile'
export const devicePreviewAtom = atom<DevicePreview>('desktop')

// Color palette (persisted globally in localStorage)
export interface PaletteColor {
  id: string
  name: string
  value: string // hex
  locked?: boolean // system defaults — cannot be deleted, but can be edited
}

export const DEFAULT_PALETTE: PaletteColor[] = [
  { id: 'primary', name: 'Primary', value: '#6366f1', locked: true },
  { id: 'primary-light', name: 'Primary Light', value: '#818cf8', locked: true },
  { id: 'bg-dark', name: 'Background', value: '#08080d', locked: true },
  { id: 'bg-surface', name: 'Surface', value: '#18181f', locked: true },
  { id: 'text', name: 'Text', value: '#f8fafc', locked: true },
  { id: 'text-muted', name: 'Text Muted', value: '#94a3b8', locked: true },
  { id: 'success', name: 'Success', value: '#10b981', locked: true },
  { id: 'warning', name: 'Warning', value: '#f59e0b', locked: true },
  { id: 'error', name: 'Error', value: '#ef4444', locked: true },
]

export const colorPaletteAtom = atomWithStorage<PaletteColor[]>('puaforge_color_palette', DEFAULT_PALETTE)
