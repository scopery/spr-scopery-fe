/**
 * Typography tokens
 * These map to CSS variables defined in globals.css
 *
 * Font rule: weight < 500 → Questrial | weight >= 500 (medium, semibold, bold) → Cal Sans
 * Applied in globals.css and Typography component.
 */

export const fontSize = {
  xs: 'var(--font-size-xs)', // 0.75rem / 12px
  sm: 'var(--font-size-sm)', // 0.875rem / 14px
  base: 'var(--font-size-base)', // 1rem / 16px
  lg: 'var(--font-size-lg)', // 1.125rem / 18px
  xl: 'var(--font-size-xl)', // 1.25rem / 20px
  '2xl': 'var(--font-size-2xl)', // 1.5rem / 24px
} as const

export const lineHeight = {
  xs: 'var(--line-height-xs)', // 1rem
  sm: 'var(--line-height-sm)', // 1.25rem
  base: 'var(--line-height-base)', // 1.5rem
  lg: 'var(--line-height-lg)', // 1.75rem
  xl: 'var(--line-height-xl)', // 1.75rem
  '2xl': 'var(--line-height-2xl)', // 2rem
} as const

export const fontWeight = {
  normal: 'var(--font-weight-normal)', // 400
  medium: 'var(--font-weight-medium)', // 500
  semibold: 'var(--font-weight-semibold)', // 600
  bold: 'var(--font-weight-bold)', // 700
} as const

export type FontSizeToken = typeof fontSize
export type LineHeightToken = typeof lineHeight
export type FontWeightToken = typeof fontWeight
