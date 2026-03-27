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
  { id: 'claude-3-haiku-20240307', name: 'Haiku', description: 'Rápido e leve', tier: 'free' },
  { id: 'claude-3-5-haiku-20241022', name: 'Haiku 3.5', description: 'Rápido e capaz', tier: 'free' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Sonnet 3.5', description: 'Equilibrado', tier: 'paid' },
  { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', description: 'Avançado', tier: 'paid' },
  { id: 'claude-opus-4-20250514', name: 'Opus 4', description: 'Mais poderoso', tier: 'paid' },
]

export const selectedModelAtom = atom('claude-3-haiku-20240307')

// Device preview
export type DevicePreview = 'desktop' | 'tablet' | 'mobile'
export const devicePreviewAtom = atom<DevicePreview>('desktop')
