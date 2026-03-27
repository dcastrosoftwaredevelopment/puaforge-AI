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

// App view: home or editor
export type AppView = 'home' | 'editor'
export const appViewAtom = atom<AppView>('home')

// Messages (scoped to active project)
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
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

// UI state
export const isChatOpenAtom = atom(true)
export const isGeneratingAtom = atom(false)
export const activeFileAtom = atom('/App.tsx')

// View mode
export type ViewMode = 'editor' | 'preview' | 'split'
export const viewModeAtom = atom<ViewMode>('preview')

// Claude model selection
export interface ClaudeModel {
  id: string
  name: string
  description: string
  tier: 'free' | 'paid'
}

export const CLAUDE_MODELS: ClaudeModel[] = [
  { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5', description: 'Rápido e leve', tier: 'free' },
  { id: 'claude-sonnet-4-6-20250514', name: 'Sonnet 4.6', description: 'Equilibrado', tier: 'paid' },
  { id: 'claude-opus-4-6-20250514', name: 'Opus 4.6', description: 'Mais poderoso', tier: 'paid' },
]

export const selectedModelAtom = atom('claude-haiku-4-5-20251001')

// Device preview
export type DevicePreview = 'desktop' | 'tablet' | 'mobile'
export const devicePreviewAtom = atom<DevicePreview>('desktop')
