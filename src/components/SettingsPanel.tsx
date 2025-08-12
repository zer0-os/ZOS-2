import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ThemePicker } from '@/components/ThemePicker'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { BackgroundPicker } from '@/components/BackgroundPicker'
import { useThemeContext } from '@/contexts/ThemeProvider'
import { THEME_VARIANTS, THEMES } from '@/lib/theme'
import { Palette, Settings } from 'lucide-react'

/**
 * Comprehensive settings panel with theme management
 */
export function SettingsPanel() {
  const { theme, themeVariant } = useThemeContext()

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize your app experience</p>
        </div>
      </div>

      <Separator />

      {/* Theme Settings Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Appearance</h2>
          <p className="text-muted-foreground">
            Customize the look and feel of your interface
          </p>
        </div>

        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Selection
            </CardTitle>
            <CardDescription>
              Choose from Light, Midnight, or Black Out themes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Current theme: <span className="capitalize">{THEMES[theme].name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {THEMES[theme].description}
                </p>
              </div>
              <ThemeSwitcher />
            </div>
          </CardContent>
        </Card>

        {/* Color Theme Picker */}
        <div>
          <ThemePicker />
        </div>

        {/* Background Style Picker */}
        <div>
          <BackgroundPicker />
        </div>

        {/* Current Theme Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Current Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: `hsl(${THEME_VARIANTS[themeVariant].color})` }}
                />
                <div>
                  <p className="font-medium">{THEME_VARIANTS[themeVariant].name} Theme</p>
                  <p className="text-sm text-muted-foreground">
                    {THEME_VARIANTS[themeVariant].description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">Primary</p>
                  <div className="w-full h-8 bg-primary rounded border" />
                  <p className="text-xs text-muted-foreground">Primary color</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Secondary</p>
                  <div className="w-full h-8 bg-secondary rounded border" />
                  <p className="text-xs text-muted-foreground">Secondary color</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Accent</p>
                  <div className="w-full h-8 bg-accent rounded border" />
                  <p className="text-xs text-muted-foreground">Accent color</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Success</p>
                  <div className="w-full h-8 bg-success rounded border" />
                  <p className="text-xs text-muted-foreground">Success color</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Themes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">How it works</h4>
              <p className="text-sm text-muted-foreground">
                Themes use CSS variables to dynamically change colors throughout the app. 
                All components automatically adapt to your selected theme without requiring restarts.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Persistence</h4>
              <p className="text-sm text-muted-foreground">
                Your theme preferences are saved locally and will be remembered across sessions.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">System Integration</h4>
              <p className="text-sm text-muted-foreground">
                When set to "System", the app automatically switches between light and dark modes 
                based on your operating system's preference.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
