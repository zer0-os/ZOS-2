import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CompactThemePicker } from '@/components/ThemePicker'
import { CompactBackgroundPicker } from '@/components/BackgroundPicker'
import { ThemeToggle } from '@/components/ThemeSwitcher'
import { useThemeContext } from '@/contexts/ThemeProvider'
import { THEME_VARIANTS, THEMES } from '@/lib/theme'
import { Settings, Palette } from 'lucide-react'

interface SettingsPopupProps {
  children: React.ReactNode
}

/**
 * Settings popup that opens when clicking the settings trigger
 * Contains theme controls and color picker
 */
export function SettingsPopup({ children }: SettingsPopupProps) {
  const { theme, themeVariant } = useThemeContext()
  const currentTheme = THEME_VARIANTS[themeVariant]

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" side="right" sideOffset={8}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Settings</h3>
          </div>

          <Separator />

          {/* Theme Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="text-sm font-medium">Theme</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm">{THEMES[theme].name}</p>
                <p className="text-xs text-muted-foreground">
                  {THEMES[theme].description}
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <Separator />

          {/* Theme Colors Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="text-sm font-medium">Theme Colors</span>
            </div>

            {/* Current Theme Display */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div 
                className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: `hsl(${currentTheme.color})` }}
              />
              <div>
                <p className="text-sm font-medium">{currentTheme.name}</p>
                <p className="text-xs text-muted-foreground">{currentTheme.description}</p>
              </div>
            </div>

            {/* Color Picker */}
            <CompactThemePicker />
          </div>

          <Separator />

          {/* Background Style Picker */}
          <div className="space-y-3">
            <CompactBackgroundPicker />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Compact settings popup for smaller spaces
 */
export function CompactSettingsPopup({ children }: SettingsPopupProps) {
  const { themeVariant } = useThemeContext()
  const currentTheme = THEME_VARIANTS[themeVariant]

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start" side="right" sideOffset={8}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Settings</span>
            </div>
            <ThemeToggle />
          </div>

          <Separator />

          {/* Current Theme */}
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: `hsl(${currentTheme.color})` }}
            />
            <span className="text-sm">{currentTheme.name} Theme</span>
          </div>

          {/* Color Picker */}
          <CompactThemePicker />

          <Separator />

          {/* Background Picker */}
          <CompactBackgroundPicker />
        </div>
      </PopoverContent>
    </Popover>
  )
}
