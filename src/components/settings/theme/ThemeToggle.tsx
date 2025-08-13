import { Button } from '@/components/ui/button'
import { useThemeContext } from '@/contexts/ThemeProvider'
import { THEMES } from '@/lib/theme'
import { Sun, Moon, Circle } from 'lucide-react'

/**
 * Simple cycle button that switches between all themes
 */
export function ThemeToggle() {
  const { theme, cycleTheme } = useThemeContext()

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light': return <Sun className="!h-5 !w-5" strokeWidth={1.5} />
      case 'midnight': return <Moon className="!h-5 !w-5" strokeWidth={1.5} />
      case 'blackout': return <Circle className="!h-5 !w-5 fill-current" strokeWidth={1.5} />
      default: return <Sun className="!h-5 !w-5" strokeWidth={1.5} />
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-10 w-10"
      title={`Current: ${THEMES[theme].name}`}
    >
      {getThemeIcon(theme)}
      <span className="sr-only">Cycle theme</span>
    </Button>
  )
}
