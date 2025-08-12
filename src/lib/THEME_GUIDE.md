# Custom Theme System Guide

This project uses a custom theme system built on top of shadcn/ui and Radix, using CSS variables for seamless theming without component overrides.

## Overview

The theme system is based on CSS variables defined in `src/index.css` and managed through utility functions. This approach provides:

- **No component overrides needed** - All shadcn components automatically use the theme
- **Full dark mode support** - Separate color palettes for light and dark themes  
- **Runtime theme switching** - Dynamic theme changes without page reload
- **Custom theme variants** - Easy creation of additional theme variations
- **System preference support** - Automatic detection of user's system theme preference

## Core Theme Colors

### Primary Colors
- `--primary` - Main brand color (green: `174 99% 48%`)
- `--primary-foreground` - Text on primary backgrounds
- `--secondary` - Secondary accent color
- `--secondary-foreground` - Text on secondary backgrounds

### Surface Colors
- `--background` - Main background color
- `--foreground` - Main text color
- `--card` - Card/panel backgrounds
- `--card-foreground` - Text on cards
- `--popover` - Popover/dropdown backgrounds
- `--popover-foreground` - Text in popovers

### Interactive Colors
- `--muted` - Muted backgrounds (disabled states, etc.)
- `--muted-foreground` - Muted text
- `--accent` - Hover states and accents
- `--accent-foreground` - Text on accent backgrounds

### Semantic Colors
- `--destructive` - Error/danger states
- `--destructive-foreground` - Text on destructive backgrounds
- `--success` - Success states
- `--success-foreground` - Text on success backgrounds
- `--warning` - Warning states  
- `--warning-foreground` - Text on warning backgrounds
- `--info` - Information states
- `--info-foreground` - Text on info backgrounds

### Border & Input Colors
- `--border` - Default border color
- `--input` - Input field borders
- `--ring` - Focus ring color

### Layout
- `--radius` - Default border radius (`0.75rem`)

## Usage

### 1. Basic Setup

Wrap your app with the ThemeProvider:

```tsx
import { ThemeProvider } from '@/contexts/ThemeProvider'

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      {/* Your app content */}
    </ThemeProvider>
  )
}
```

### 2. Using Theme Controls

```tsx
import { ThemeSwitcher, ThemeToggle } from '@/components/ThemeSwitcher'
import { useThemeContext } from '@/contexts/ThemeProvider'

// Full theme switcher with light/dark/system options
<ThemeSwitcher />

// Simple toggle between light/dark
<ThemeToggle />

// Programmatic theme control
const { theme, setTheme, toggleTheme } = useThemeContext()
```

### 3. Using Theme Colors in Components

All shadcn components automatically use the theme colors. For custom components:

```tsx
// Use Tailwind classes (recommended)
<div className="bg-primary text-primary-foreground">
  Primary colored content
</div>

<div className="bg-success text-success-foreground">
  Success message
</div>

// Or use CSS variables directly
<div style={{ backgroundColor: 'hsl(var(--primary))' }}>
  Custom styled content
</div>
```

### 4. Available Tailwind Classes

The theme extends Tailwind with these color classes:

```tsx
// Primary colors
bg-primary text-primary-foreground
border-primary ring-primary

// Semantic colors  
bg-success text-success-foreground
bg-warning text-warning-foreground
bg-info text-info-foreground
bg-destructive text-destructive-foreground

// Surface colors
bg-background text-foreground
bg-card text-card-foreground
bg-popover text-popover-foreground
bg-muted text-muted-foreground
bg-accent text-accent-foreground

// Interactive colors
border-border bg-input ring-ring
```

## Customization

### 1. Modify Base Theme

Edit the CSS variables in `src/index.css`:

```css
:root {
  --primary: 174 99% 48%;  /* Your brand color */
  --secondary: 220 14.3% 95.9%;
  /* ... other colors */
}

.dark {
  --primary: 174 99% 48%;  /* Dark mode variant */
  /* ... other dark colors */
}
```

### 2. Create Theme Variants

Use the utility functions to create custom theme variants:

```tsx
import { createThemeVariant, applyThemeVariant } from '@/lib/theme'

// Create a "brand" theme variant
createThemeVariant('brand', {
  primary: '200 100% 50%',        // Bright blue
  secondary: '200 20% 90%',
  accent: '200 30% 85%',
}, {
  // Dark mode colors for the variant
  primary: '200 80% 60%',
  secondary: '200 20% 20%',
  accent: '200 30% 25%',
})

// Apply the variant
applyThemeVariant('brand')
```

### 3. Dynamic Color Updates

```tsx
import { setCSSVariable, getCSSVariable } from '@/lib/theme'

// Get current primary color
const currentPrimary = getCSSVariable('primary')

// Update primary color dynamically
setCSSVariable('primary', '174 99% 48%') // Bright green
```

## Color Format

Colors use HSL format without the `hsl()` wrapper:
- Format: `hue saturation% lightness%`
- Example: `174 99% 48%` = `hsl(174, 99%, 48%)`

This format allows Tailwind to apply opacity modifiers:
- `bg-primary/50` = 50% opacity primary color
- `text-primary/80` = 80% opacity primary text

## Best Practices

1. **Use semantic colors** - Prefer `bg-success` over specific colors for better theme consistency
2. **Test both themes** - Always verify your UI works in both light and dark modes
3. **Use foreground pairs** - Always pair background colors with their foreground variants
4. **Leverage CSS variables** - Use the provided variables for consistent theming
5. **Follow accessibility** - Ensure sufficient contrast between background and foreground colors

## File Structure

```
src/
├── lib/
│   ├── theme.ts           # Core theme utilities
│   └── THEME_GUIDE.md     # This documentation
├── hooks/
│   └── useTheme.ts        # Theme hook for React
├── contexts/
│   └── ThemeProvider.tsx  # Theme context provider
├── components/
│   └── ThemeSwitcher.tsx  # Theme switching components
└── index.css              # CSS variables and base styles
```

## Migration from Default shadcn

If migrating from default shadcn theming:

1. Your existing components will work unchanged
2. You gain additional semantic colors (success, warning, info)
3. Enhanced theme switching capabilities
4. Better dark mode support
5. Runtime theme customization options

The system is fully backward compatible with standard shadcn/ui components.
