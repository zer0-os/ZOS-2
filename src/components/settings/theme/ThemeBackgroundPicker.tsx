import React from 'react'
import { Button } from '@/components/ui/button'
import { useThemeContext } from '@/contexts/ThemeProvider'
import { BACKGROUND_VARIANTS, type BackgroundVariant } from '@/lib/theme'
import { Check } from 'lucide-react'

/**
 * Theme background picker for selecting background styles
 */
export function ThemeBackgroundPicker() {
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