import { useThemeContext } from '@/contexts/ThemeProvider'
import { BACKGROUND_VARIANTS, type BackgroundVariant } from '@/lib/theme'

/**
 * Hook to get the current background class for components
 * This allows components to automatically adapt to the selected background variant
 */
export function useBackgroundClass(override?: BackgroundVariant): string {
  const { backgroundVariant } = useThemeContext()
  const variant = override || backgroundVariant
  return BACKGROUND_VARIANTS[variant].className
}

