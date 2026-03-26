export const DEFAULT_FILES: Record<string, string> = {
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
}
