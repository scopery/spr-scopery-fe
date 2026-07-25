/** Fixed highlight palettes — only these tones; no custom colors. */

export const HIGHLIGHT_BG_KEY = 'highlightBg' as const
export const HIGHLIGHT_TEXT_KEY = 'highlightText' as const

/** @deprecated Prefer HIGHLIGHT_BG_KEY / HIGHLIGHT_TEXT_KEY */
export const TEXT_HIGHLIGHT_KEY = 'textHighlight' as const

export const HIGHLIGHT_TONES = [
  'red',
  'amber',
  'yellow',
  'emerald',
  'sky',
  'blue',
  'violet',
  'rose',
  'slate',
] as const

export type HighlightTone = (typeof HIGHLIGHT_TONES)[number]

/** Alias kept for older imports */
export type TextHighlightTone = HighlightTone
export const TEXT_HIGHLIGHT_TONES = HIGHLIGHT_TONES

export function isHighlightTone(value: unknown): value is HighlightTone {
  return typeof value === 'string' && (HIGHLIGHT_TONES as readonly string[]).includes(value)
}

export const isTextHighlightTone = isHighlightTone

export const HIGHLIGHT_TONE_META: Record<
  HighlightTone,
  { label: string; text: string; bg: string; swatch: string }
> = {
  red: { label: 'Red', text: 'text-red-800', bg: 'bg-red-100', swatch: 'bg-red-500' },
  amber: { label: 'Amber', text: 'text-amber-800', bg: 'bg-amber-100', swatch: 'bg-amber-500' },
  yellow: { label: 'Yellow', text: 'text-yellow-800', bg: 'bg-yellow-100', swatch: 'bg-yellow-400' },
  emerald: {
    label: 'Emerald',
    text: 'text-emerald-800',
    bg: 'bg-emerald-100',
    swatch: 'bg-emerald-500',
  },
  sky: { label: 'Sky', text: 'text-sky-800', bg: 'bg-sky-100', swatch: 'bg-sky-500' },
  blue: { label: 'Blue', text: 'text-blue-800', bg: 'bg-blue-100', swatch: 'bg-blue-500' },
  violet: { label: 'Violet', text: 'text-violet-800', bg: 'bg-violet-100', swatch: 'bg-violet-500' },
  rose: { label: 'Rose', text: 'text-rose-800', bg: 'bg-rose-100', swatch: 'bg-rose-500' },
  slate: { label: 'Slate', text: 'text-slate-800', bg: 'bg-slate-100', swatch: 'bg-slate-500' },
}

/** @deprecated */
export const TEXT_HIGHLIGHT_CLASSES = HIGHLIGHT_TONE_META

export function highlightBgClassName(tone: HighlightTone | null | undefined) {
  if (!tone || !isHighlightTone(tone)) return undefined
  return HIGHLIGHT_TONE_META[tone].bg
}

export function highlightTextClassName(tone: HighlightTone | null | undefined) {
  if (!tone || !isHighlightTone(tone)) return undefined
  return HIGHLIGHT_TONE_META[tone].text
}
