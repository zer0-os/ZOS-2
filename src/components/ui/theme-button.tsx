import * as React from "react"
import { Button } from "@/components/ui/button"
import type { ButtonProps } from "@/components/ui/button"
import { useThemeContext } from "@/contexts/ThemeProvider"
import { cn } from "@/lib/utils"

const ThemeButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    const { theme, backgroundVariant } = useThemeContext()
    
    // Define theme-specific hover classes for ghost variant
    const getGhostHoverClasses = () => {
      if (variant !== 'ghost') return ''
      
      switch (theme) {
        case 'light':
          switch (backgroundVariant) {
            case 'subtle':
              return 'hover:!bg-slate-200 hover:!text-slate-900'
            default:
              return 'hover:!bg-slate-100 hover:!text-slate-900'
          }
        case 'midnight':
          switch (backgroundVariant) {
            case 'subtle':
              return 'hover:!bg-blue-600/80 hover:!text-blue-50'
            default:
              return 'hover:!bg-blue-700/80 hover:!text-blue-50'
          }
        case 'blackout':
          switch (backgroundVariant) {
            case 'subtle':
              return 'hover:!bg-neutral-700 hover:!text-neutral-100'
            default:
              return 'hover:!bg-neutral-800 hover:!text-neutral-100'
          }
        default:
          return 'hover:!bg-slate-100 hover:!text-slate-900'
      }
    }

    const themeHoverClasses = getGhostHoverClasses()

    return (
      <Button
        className={cn(themeHoverClasses, className)}
        variant={variant}
        ref={ref}
        {...props}
      />
    )
  }
)
ThemeButton.displayName = "ThemeButton"

export { ThemeButton }
