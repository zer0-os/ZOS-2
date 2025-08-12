import React, { createContext, useContext, useEffect } from 'react'
import { initTheme } from '@/lib/theme'
import { useTheme } from '@/hooks/useTheme'
import type { Theme, ThemeVariant, BackgroundVariant } from '@/lib/theme'

interface ThemeContextType {
  theme: Theme
  themeVariant: ThemeVariant
  backgroundVariant: BackgroundVariant
  setTheme: (theme: Theme) => void
  setThemeVariant: (variant: ThemeVariant) => void
  setBackgroundVariant: (variant: BackgroundVariant) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

/**
 * Theme provider component that manages theme state globally
 * Wrap your app with this component to enable theme functionality
 */
export function ThemeProvider({
  children,
  defaultTheme = 'light',
  ...props
}: ThemeProviderProps) {
  const themeHook = useTheme()

  // Initialize theme system on mount
  useEffect(() => {
    initTheme()
  }, [])

  return (
    <ThemeContext.Provider value={themeHook}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 * Must be used within a ThemeProvider
 */
export function useThemeContext() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  
  return context
}
