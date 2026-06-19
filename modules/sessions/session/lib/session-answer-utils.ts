export type AnswerStatus = 'answered' | 'skipped' | 'na'

/** Display order of sections (same as admin template — not alphabetical). */
export const SECTION_ORDER = ['overview', 'scope', 'risks', 'timeline', 'assumptions', 'general']

export function answerValuesEqual(local: unknown, server: unknown): boolean {
  if (local === server) return true
  if (local == null && server == null) return true
  if (local == null || server == null) return false
  const toStr = (v: unknown): string => {
    if (typeof v === 'string') return v
    if (v !== null && typeof v === 'object' && 'text' in v)
      return String((v as { text?: unknown }).text ?? '')
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return toStr(local) === toStr(server)
}

export function sectionSortIndex(section: string): number {
  const i = SECTION_ORDER.indexOf(section || 'general')
  return i >= 0 ? i : SECTION_ORDER.length
}

/** Default value shape per q_type when switching back to "Answered" so we never send empty by mistake */
export function getDefaultValueForType(qType: string): unknown {
  switch (qType) {
    case 'text':
    case 'textarea':
      return { text: '' }
    case 'number':
      return { number: undefined }
    case 'boolean':
      return { boolean: false }
    case 'date':
      return { date: '' }
    case 'select':
    case 'single_select':
      return ''
    default:
      return {}
  }
}
