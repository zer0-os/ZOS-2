import React from 'react'
import { Button } from '@/ui/button'
import { useThemeContext } from '@/os/theme/ThemeProvider'
import { THEME_VARIANTS, type ThemeVariant } from '@/os/theme/theme-variants'
import { Palette } from 'lucide-react'

interface ThemeAccentPickerProps {
  className?: string
}

/**
 * Theme accent color picker for selecting theme variants
 */
export function ThemeAccentPicker({ className = '' }: ThemeAccentPickerProps) {
  const { themeVariant, setThemeVariant } = useThemeContext()

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Palette className="h-4 w-4" />
        <span>Theme</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(THEME_VARIANTS).map(([key, variant]) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 rounded-full border-2 ${
              themeVariant === key 
                ? 'border-primary shadow-md' 
                : 'border-border hover:border-muted-foreground'
            }`}
            onClick={() => setThemeVariant(key as ThemeVariant)}
            title={`${variant.name} theme`}
          >
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: `hsl(${variant.color})` }}
            />
          </Button>
        ))}
      </div>
    </div>
  )
}
