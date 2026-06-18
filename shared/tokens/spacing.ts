/**
 * Spacing tokens
 * These map to CSS variables defined in globals.css
 */

export const spacing = {
  xs: 'var(--spacing-xs)', // 0.25rem / 4px
  sm: 'var(--spacing-sm)', // 0.5rem / 8px
  md: 'var(--spacing-md)', // 1rem / 16px
  lg: 'var(--spacing-lg)', // 1.5rem / 24px
  xl: 'var(--spacing-xl)', // 2rem / 32px
  '2xl': 'var(--spacing-2xl)', // 3rem / 48px
} as const

export type SpacingToken = typeof spacing

