import { atom } from 'jotai'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// Project files fed to Sandpack
export const filesAtom = atom<Record<string, string>>({
  '/App.js': `export default function App() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0e0f16',
      color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#f1f5f9', fontWeight: 600 }}>Vibe Platform</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Descreva o que deseja construir no chat...</p>
      </div>
    </div>
  )
}`,
})

// Chat messages
export const messagesAtom = atom<Message[]>([])

// UI state
export const isChatOpenAtom = atom(true)
export const isGeneratingAtom = atom(false)
export const activeFileAtom = atom('/App.js')

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
