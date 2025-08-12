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

/**
 * Hook to get background variant information
 */
export function useBackgroundVariant() {
  const { backgroundVariant } = useThemeContext()
  return {
    variant: backgroundVariant,
    info: BACKGROUND_VARIANTS[backgroundVariant],
    className: BACKGROUND_VARIANTS[backgroundVariant].className
  }
}
