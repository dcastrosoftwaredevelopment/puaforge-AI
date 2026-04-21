import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from 'flowbite-react'
import './index.css'
import './i18n'
import App from './App'
import { initAnalytics } from '@/lib/analytics'
import { flowbiteTheme } from '@/lib/flowbiteTheme'

initAnalytics()

declare const __GOOGLE_CLIENT_ID__: string

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={__GOOGLE_CLIENT_ID__ || ''}>
      <BrowserRouter>
        <ThemeProvider theme={flowbiteTheme} clearTheme={{ sidebar: true, textInput: true, modal: true }}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
