/**
 * Shadow tokens
 * These map to CSS variables defined in globals.css
 */

export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
} as const

export type ShadowToken = typeof shadows

