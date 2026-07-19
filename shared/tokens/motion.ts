/**
 * Motion tokens — durations and easings for productive / expressive UI.
 * CSS source of truth: `app/globals.css` `:root` variables.
 */
export const motion = {
  instant: '80ms',
  fast: '120ms',
  base: '180ms',
  panel: '220ms',
  context: '280ms',
  expressive: '340ms',
} as const

export const easing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const

export type MotionToken = keyof typeof motion
export type EasingToken = keyof typeof easing
