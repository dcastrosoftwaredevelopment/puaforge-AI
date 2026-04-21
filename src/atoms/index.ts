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
export const viewModeAtom = atom<ViewMode>('split')

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
export const editorFractionAtom = atom(0.3)
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
  // Brand
  { id: 'terracotta', name: 'Terracota (Accent)', value: '#D65A31', locked: true },
  { id: 'vibe-blue', name: 'Vibe Blue (AI)', value: '#00E5FF', locked: true },
  // Backgrounds
  { id: 'bg-primary', name: 'Background Primary', value: '#0D0D0D', locked: true },
  { id: 'bg-secondary', name: 'Background Secondary', value: '#141414', locked: true },
  { id: 'bg-tertiary', name: 'Background Tertiary', value: '#1A1A1A', locked: true },
  { id: 'bg-elevated', name: 'Background Elevated', value: '#1F1F1F', locked: true },
  // Text
  { id: 'text-primary', name: 'Text Primary', value: '#E0E0E0', locked: true },
  { id: 'code-muted', name: 'Code Text Muted', value: '#94a3b8', locked: true },
]

export const colorPaletteAtom = atom<PaletteColor[]>(DEFAULT_PALETTE)

// Custom domain for the active project (null = not configured)
export const customDomainAtom = atom<string | null>(null)

// Set to true by useProjectLoader once project data is fully loaded into atoms.
// useDraft watches this to avoid treating the initial load as a user change.
export const projectLoadedAtom = atom(false)

// Plan upgrade modal
export interface UpgradePrompt {
  requiredPlan: 'indie' | 'pro'
  limitType: string
  message: string
}
export const upgradePromptAtom = atom<UpgradePrompt | null>(null)

// Mobile sidebar drawer
export const sidebarOpenAtom = atom(false)

// External npm dependencies detected from AI-generated code
export const depsAtom = atom<Record<string, string>>({})

// Elementor-style inspect mode
export const inspectModeAtom = atom(false)

export interface SelectedElement {
  id: string
  tagName: string
  className: string
  inlineStyle?: string
  rect: { top: number; left: number; width: number; height: number }
}
export const selectedElementAtom = atom<SelectedElement | null>(null)
export const hoveredElementAtom = atom<SelectedElement | null>(null)

export interface DOMNode {
  id: string
  tagName: string
  className: string
  children: DOMNode[]
}
export const domTreeAtom = atom<DOMNode[]>([])

export type EditorPanelMode = 'code' | 'style' | 'layers'
export const editorPanelModeAtom = atom<EditorPanelMode>('style')
