/** Timeline schedule-bar fill colors. */
export const TIMELINE_BAR_COLORS = {
  /** Design-system primary gradient token. */
  project: 'var(--color-primary-gradient)',
  /** Phase base is white; stripes use this accent. */
  phase: '#ffffff',
  phaseStripe: 'oklch(72% 0.03 122)',
  /** Design-system secondary token. */
  wbs: 'var(--color-secondary)',
  milestone: 'oklch(64.6% 0.222 41.116)',
  task: 'oklch(90.1% 0.058 230.902)',
  /** Matches design token `neutral-300`. */
  taskUnassigned: 'var(--color-neutral-300, #d4d4d4)',
} as const

/** Diagonal hatch image layer only — pair with white backgroundColor. */
export const TIMELINE_PHASE_HATCH_IMAGE = `repeating-linear-gradient(
  -45deg,
  ${TIMELINE_BAR_COLORS.phaseStripe} 0 1.5px,
  transparent 1.5px 11px
)`

/** Shorthand for legend swatches / places that take a single `background` value. */
export const TIMELINE_PHASE_HATCH_BACKGROUND = `${TIMELINE_PHASE_HATCH_IMAGE}, ${TIMELINE_BAR_COLORS.phase}`

export type TimelineBarColorKey = keyof typeof TIMELINE_BAR_COLORS
