/**
 * Extract full answer text from answer value for AI clarity assess-one.
 * Do not log answer_text.
 */

function safeString(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'object' && v !== null && 'text' in v) {
    const t = (v as { text?: unknown }).text
    return typeof t === 'string' ? t : ''
  }
  return ''
}

/**
 * Single/multi select: get options from schema for label lookup.
 */
function getOptionsFromSchema(schema: Record<string, unknown>): Array<{ value: string; label?: string }> {
  const opts = (schema.options ?? schema.enum) as Array<{ value?: string; label?: string } | string> | undefined
  if (!Array.isArray(opts)) return []
  return opts.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : { value: String((o as { value?: string }).value ?? ''), label: (o as { label?: string }).label }
  )
}

/**
 * Convert answer value to plain text for assess-one payload.
 * - text/textarea: value.text or string value
 * - boolean/number: String(value)
 * - single_select: prefer label then value
 * - multi_select: join labels or values
 * - date: value.date or String(value)
 * - fallback: JSON.stringify (do not log)
 */
export function toAnswerText(qType: string, value: unknown, answerSchema?: Record<string, unknown>): string {
  if (value == null) return ''

  if (typeof value === 'object' && value !== null && 'text' in value) {
    const t = (value as { text?: unknown }).text
    if (typeof t === 'string') return t
  }
  if (qType === 'text' || qType === 'textarea') {
    if (typeof value === 'string') return value
    return safeString((value as { text?: string })?.text)
  }

  if (typeof value === 'boolean' || typeof value === 'number') return String(value)

  if (qType === 'single_select' || qType === 'select') {
    const str = typeof value === 'string' ? value : (value as { select?: string })?.select ?? ''
    const schema = answerSchema ?? {}
    const options = getOptionsFromSchema(schema)
    const opt = options.find((o) => o.value === str)
    return (opt?.label ?? opt?.value ?? str) || ''
  }

  if (qType === 'multi_select') {
    const arr = Array.isArray(value) ? value : (value as { multi_select?: unknown[] })?.multi_select
    if (!Array.isArray(arr)) return ''
    const schema = answerSchema ?? {}
    const options = getOptionsFromSchema(schema)
    const parts = arr.map((v) => {
      const s = typeof v === 'string' ? v : String(v)
      const opt = options.find((o) => o.value === s)
      return opt?.label ?? opt?.value ?? s
    })
    return parts.join(', ')
  }

  if (qType === 'date') {
    const d = (value as { date?: string })?.date ?? (typeof value === 'string' ? value : '')
    return typeof d === 'string' ? d : ''
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
