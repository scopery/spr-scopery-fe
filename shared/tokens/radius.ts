/**
 * Border radius tokens
 * These map to CSS variables defined in globals.css
 */

export const radius = {
  xs: 'var(--radius-xs)', // 0.125rem / 2px
  sm: 'var(--radius-sm)', // 0.25rem / 4px
  md: 'var(--radius-md)', // 0.375rem / 6px
  lg: 'var(--radius-lg)', // 0.5rem / 8px
  xl: 'var(--radius-xl)', // 0.75rem / 12px
} as const

export type RadiusToken = typeof radius

