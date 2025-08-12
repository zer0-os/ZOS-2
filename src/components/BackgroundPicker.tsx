import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useThemeContext } from '@/contexts/ThemeProvider'
import { BACKGROUND_VARIANTS, type BackgroundVariant } from '@/lib/theme'
import { Palette, Check } from 'lucide-react'

/**
 * Background picker component for selecting different background styles
 */
export function BackgroundPicker() {
  const { backgroundVariant, setBackgroundVariant } = useThemeContext()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Background Style
        </CardTitle>
        <CardDescription>
          Choose how components and surfaces appear
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Current Style</p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded border-2 border-border bg-background" />
            <div>
              <p className="text-sm font-medium">{BACKGROUND_VARIANTS[backgroundVariant].name}</p>
              <p className="text-xs text-muted-foreground">{BACKGROUND_VARIANTS[backgroundVariant].description}</p>
            </div>
          </div>
        </div>

        {/* Background Options Grid */}
              <div className="space-y-2">
        <p className="text-sm font-medium">Available Styles</p>
        <div className="grid grid-cols-3 gap-3">
            {Object.entries(BACKGROUND_VARIANTS).map(([key, variant]) => (
              <Button
                key={key}
                variant={backgroundVariant === key ? "default" : "outline"}
                size="sm"
                className="h-auto p-3 flex flex-col items-start gap-2 relative"
                onClick={() => setBackgroundVariant(key as BackgroundVariant)}
              >
                {backgroundVariant === key && (
                  <Check className="absolute top-2 right-2 h-3 w-3" />
                )}
                <div className="w-full h-6 rounded border bg-background/60 border-border/60" />
                <div className="text-left">
                  <p className="text-xs font-medium">{variant.name}</p>
                  <p className="text-xs text-muted-foreground">{variant.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Preview</p>
          <div className="h-16 rounded border bg-background flex items-center justify-center">
            <span className="text-sm text-foreground">
              {BACKGROUND_VARIANTS[backgroundVariant].name} Background
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {BACKGROUND_VARIANTS[backgroundVariant].description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact background picker for smaller spaces
 */
export function CompactBackgroundPicker() {
  const { backgroundVariant, setBackgroundVariant } = useThemeContext()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Background Style</p>
        <span className="text-xs text-muted-foreground">{BACKGROUND_VARIANTS[backgroundVariant].name}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(BACKGROUND_VARIANTS).map(([key, variant]) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            className={`h-8 p-1 relative ${backgroundVariant === key ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setBackgroundVariant(key as BackgroundVariant)}
            title={`${variant.name} - ${variant.description}`}
          >
            {backgroundVariant === key && (
              <Check className="absolute -top-1 -right-1 h-3 w-3 bg-primary text-primary-foreground rounded-full p-0.5" />
            )}
            <div className="w-full h-4 rounded-sm border bg-background/60 border-border/60" />
          </Button>
        ))}
      </div>
    </div>
  )
}
