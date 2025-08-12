import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeProvider'
import { QueryProvider } from './providers/QueryProvider'
import { AuthGuard } from './components/auth/AuthGuard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider defaultTheme="light">
        <AuthGuard>
          <App />
        </AuthGuard>
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
)
