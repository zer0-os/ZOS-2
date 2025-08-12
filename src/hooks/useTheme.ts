import { useEffect, useState } from 'react'
import { 
  getTheme, 
  setTheme, 
  applyTheme, 
  getThemeVariant, 
  setThemeVariant, 
  applyThemeVariant,
  getBackgroundVariant,
  setBackgroundVariant,
  applyBackgroundVariant,
  cycleTheme,
  type Theme, 
  type ThemeVariant,
  type BackgroundVariant
} from '@/lib/theme'

/**
 * Custom hook for theme management
 * Provides theme state and controls for React components
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return getTheme()
  })

  const [themeVariant, setThemeVariantState] = useState<ThemeVariant>(() => {
    if (typeof window === 'undefined') return 'default'
    return getThemeVariant()
  })

  const [backgroundVariant, setBackgroundVariantState] = useState<BackgroundVariant>(() => {
    if (typeof window === 'undefined') return 'default'
    return getBackgroundVariant()
  })



  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Apply theme variant when it changes
  useEffect(() => {
    applyThemeVariant(themeVariant)
  }, [themeVariant])

  // Apply background variant when it changes
  useEffect(() => {
    applyBackgroundVariant(backgroundVariant)
  }, [backgroundVariant])

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    setThemeState(newTheme)
  }

  const changeThemeVariant = (newVariant: ThemeVariant) => {
    setThemeVariant(newVariant)
    setThemeVariantState(newVariant)
  }

  const changeBackgroundVariant = (newVariant: BackgroundVariant) => {
    setBackgroundVariant(newVariant)
    setBackgroundVariantState(newVariant)
  }

  const handleCycleTheme = () => {
    cycleTheme()
    setThemeState(getTheme())
  }

  return {
    theme,
    themeVariant,
    backgroundVariant,
    setTheme: changeTheme,
    setThemeVariant: changeThemeVariant,
    setBackgroundVariant: changeBackgroundVariant,
    cycleTheme: handleCycleTheme,
  }
}
