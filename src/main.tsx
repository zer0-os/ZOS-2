import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './os/theme/ThemeProvider'
import { ServicesProvider } from './kernel/providers/ServicesProvider'
import { QueryProvider } from './kernel/providers/QueryProvider'
import { AuthGuard } from '@/kernel/auth/components/AuthGuard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider defaultTheme="light">
        <AuthGuard>
          <ServicesProvider>
            <App />
          </ServicesProvider>
        </AuthGuard>
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
)
