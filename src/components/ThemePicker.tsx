import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useThemeContext } from '@/contexts/ThemeProvider'
import { THEME_VARIANTS, type ThemeVariant } from '@/lib/theme'
import { Check, Palette } from 'lucide-react'

interface ThemePickerProps {
  className?: string
}

/**
 * Comprehensive theme picker component that allows switching between different theme variants
 */
export function ThemePicker({ className = '' }: ThemePickerProps) {
  const { themeVariant, setThemeVariant } = useThemeContext()

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Theme Colors</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Choose your preferred color theme. Changes apply instantly.
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Object.entries(THEME_VARIANTS).map(([key, variant]) => (
          <ThemeVariantOption
            key={key}
            variant={key as ThemeVariant}
            name={variant.name}
            description={variant.description}
            color={variant.color}
            isSelected={themeVariant === key}
            onSelect={() => setThemeVariant(key as ThemeVariant)}
          />
        ))}
      </div>
    </Card>
  )
}

interface ThemeVariantOptionProps {
  variant: ThemeVariant
  name: string
  description: string
  color: string
  isSelected: boolean
  onSelect: () => void
}

function ThemeVariantOption({
  variant,
  name,
  description,
  color,
  isSelected,
  onSelect
}: ThemeVariantOptionProps) {
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className="h-auto p-3 flex flex-col items-center gap-2 relative"
      onClick={onSelect}
    >
      {/* Color Preview Circle */}
      <div 
        className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
        style={{ backgroundColor: `hsl(${color})` }}
      />
      
      {/* Theme Name */}
      <div className="text-center">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </Button>
  )
}

/**
 * Compact theme picker for smaller spaces (like sidebar)
 */
export function CompactThemePicker({ className = '' }: ThemePickerProps) {
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

/**
 * Inline theme picker that shows as a row of color dots
 */
export function InlineThemePicker({ className = '' }: ThemePickerProps) {
  const { themeVariant, setThemeVariant } = useThemeContext()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Colors:</span>
      <div className="flex gap-1">
        {Object.entries(THEME_VARIANTS).map(([key, variant]) => (
          <button
            key={key}
            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
              themeVariant === key 
                ? 'border-primary shadow-lg scale-110' 
                : 'border-border hover:border-muted-foreground'
            }`}
            style={{ backgroundColor: `hsl(${variant.color})` }}
            onClick={() => setThemeVariant(key as ThemeVariant)}
            title={`Switch to ${variant.name} theme`}
          />
        ))}
      </div>
    </div>
  )
}
