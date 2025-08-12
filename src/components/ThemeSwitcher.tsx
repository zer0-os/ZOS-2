import { Button } from '@/components/ui/button'
import { useThemeContext } from '@/contexts/ThemeProvider'
import { THEMES } from '@/lib/theme'
import { Sun, Moon, Circle } from 'lucide-react'

/**
 * Theme switcher component with buttons for all available themes
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeContext()

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'midnight': return <Moon className="h-4 w-4" />
      case 'blackout': return <Circle className="h-4 w-4 fill-current" />
      default: return <Sun className="h-4 w-4" />
    }
  }

  return (
    <div className="flex items-center space-x-1">
      {Object.entries(THEMES).map(([key, themeInfo]) => (
        <Button
          key={key}
          variant={theme === key ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme(key as any)}
          className="p-2"
          title={themeInfo.description}
        >
          {getThemeIcon(key)}
          <span className="sr-only">{themeInfo.name} theme</span>
        </Button>
      ))}
    </div>
  )
}

/**
 * Simple cycle button that switches between all themes
 */
export function ThemeToggle() {
  const { theme, cycleTheme } = useThemeContext()

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'midnight': return <Moon className="h-4 w-4" />
      case 'blackout': return <Circle className="h-4 w-4 fill-current" />
      default: return <Sun className="h-4 w-4" />
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      className="p-2"
      title={`Current: ${THEMES[theme].name} - Click to cycle`}
    >
      {getThemeIcon(theme)}
      <span className="sr-only">Cycle theme</span>
    </Button>
  )
}
