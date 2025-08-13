/**
 * Theme utility functions for managing custom themes
 * Based on shadcn/ui CSS variables system
 */

export type Theme = 'light' | 'midnight' | 'blackout'
export type ThemeVariant = 'default' | 'blue' | 'purple'
export type BackgroundVariant = 'default' | 'subtle' | 'gradient'

/**
 * Available themes with their display names and descriptions
 */
export const THEMES: Record<Theme, { name: string; description: string }> = {
  light: { name: 'Light', description: 'Clean and bright interface' },
  midnight: { name: 'Midnight', description: 'Dark blue with subtle warmth' },
  blackout: { name: 'Black Out', description: 'Pure black for OLED displays' },
}

/**
 * Available theme variants with their display names and descriptions
 */
export const THEME_VARIANTS: Record<ThemeVariant, { name: string; description: string; color: string }> = {
  default: { name: 'Green', description: 'Default green theme', color: '174 99% 48%' },
  blue: { name: 'Blue', description: 'Classic blue theme', color: '221.2 83.2% 53.3%' },
  purple: { name: 'Purple', description: 'Rich purple theme', color: '262.1 83.3% 57.8%' },
}

/**
 * Available background variants with their display names and descriptions
 */
export const BACKGROUND_VARIANTS: Record<BackgroundVariant, { name: string; description: string; className: string }> = {
  default: { name: 'Default', description: 'Standard theme background', className: 'bg-background' },
  subtle: { name: 'Subtle', description: 'Softer, muted appearance', className: 'bg-background' },
  gradient: { name: 'Gradient', description: 'Subtle gradient surface', className: 'bg-gradient-to-br from-background to-muted/30' },
}

/**
 * Get the current theme from localStorage
 */
export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  
  const stored = localStorage.getItem('theme') as Theme
  if (stored && ['light', 'midnight', 'blackout'].includes(stored)) {
    return stored
  }
  
  return 'light'
}

/**
 * Get the current theme variant from localStorage
 */
export function getThemeVariant(): ThemeVariant {
  if (typeof window === 'undefined') return 'default'
  
  const stored = localStorage.getItem('theme-variant') as ThemeVariant
  if (stored && Object.keys(THEME_VARIANTS).includes(stored)) {
    return stored
  }
  
  return 'default'
}

/**
 * Get the current background variant from localStorage
 */
export function getBackgroundVariant(): BackgroundVariant {
  if (typeof window === 'undefined') return 'default'
  
  const stored = localStorage.getItem('background-variant') as BackgroundVariant
  if (stored && ['default', 'subtle', 'gradient'].includes(stored)) {
    return stored
  }
  
  return 'default'
}

/**
 * Set the theme and update the DOM
 */
export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('theme', theme)
  applyTheme(theme)
}

/**
 * Set the theme variant and update the DOM
 */
export function setThemeVariant(variant: ThemeVariant) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('theme-variant', variant)
  applyThemeVariant(variant)
}

/**
 * Set the background variant and update the DOM
 */
export function setBackgroundVariant(variant: BackgroundVariant) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('background-variant', variant)
  applyBackgroundVariant(variant)
}

/**
 * Apply the theme to the document
 */
export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  // Remove existing theme classes
  root.classList.remove('light', 'midnight', 'blackout')
  
  // Apply the selected theme
  root.classList.add(theme)
}

/**
 * Initialize theme system on app startup
 */
export function initTheme() {
  const theme = getTheme()
  const variant = getThemeVariant()
  const backgroundVariant = getBackgroundVariant()
  
  applyTheme(theme)
  applyThemeVariant(variant)
  applyBackgroundVariant(backgroundVariant)
}

/**
 * Cycle through available themes
 */
export function cycleTheme() {
  const current = getTheme()
  const themes: Theme[] = ['light', 'midnight', 'blackout']
  const currentIndex = themes.indexOf(current)
  const nextIndex = (currentIndex + 1) % themes.length
  setTheme(themes[nextIndex])
}

/**
 * Apply a theme variant to the document
 */
export function applyThemeVariant(variant: ThemeVariant) {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  // Remove existing theme variant classes
  const existingVariants = Array.from(root.classList).filter(cls => cls.startsWith('theme-'))
  existingVariants.forEach(cls => root.classList.remove(cls))
  
  // Apply new variant (don't apply class for default theme)
  if (variant && variant !== 'default') {
    root.classList.add(`theme-${variant}`)
  }
}

/**
 * Apply a background variant to the document
 */
export function applyBackgroundVariant(variant: BackgroundVariant) {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  // Remove existing background variant classes
  const existingBgVariants = Array.from(root.classList).filter(cls => cls.startsWith('bg-variant-'))
  existingBgVariants.forEach(cls => root.classList.remove(cls))
  
  // Apply new background variant
  if (variant && variant !== 'default') {
    root.classList.add(`bg-variant-${variant}`)
  }
  
  // Store the current background variant for components to access
  root.setAttribute('data-background-variant', variant)
}
