import { useThemeContext } from '@/os/theme/ThemeProvider'
import { BACKGROUND_VARIANTS, type BackgroundVariant } from '@/os/theme/theme-variants'

/**
 * Hook to get the current background class for components
 * This allows components to automatically adapt to the selected background variant
 */
export function useBackgroundClass(override?: BackgroundVariant): string {
  const { backgroundVariant } = useThemeContext()
  const variant = override || backgroundVariant
  return BACKGROUND_VARIANTS[variant].className
}

