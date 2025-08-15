import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './os/theme/ThemeProvider'
import { MatrixProvider } from './drivers/matrix/MatrixProvider'
import { QueryProvider } from './kernel/providers/QueryProvider'
import { AuthGuard } from '@/kernel/auth/components/AuthGuard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider defaultTheme="light">
        <AuthGuard>
          <MatrixProvider>
            <App />
          </MatrixProvider>
        </AuthGuard>
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
)
