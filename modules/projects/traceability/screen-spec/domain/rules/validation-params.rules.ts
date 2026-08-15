export type ParamSchema = Record<string, string> | null

export function parseParamSchema(raw: string | Record<string, string> | null | undefined): ParamSchema {
  if (raw == null) return null
  if (typeof raw === 'object') return raw
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>
    }
  } catch {
    return null
  }
  return null
}

export function emptyParamsForSchema(schema: ParamSchema): Record<string, unknown> | null {
  if (!schema) return null
  const next: Record<string, unknown> = {}
  for (const [key, type] of Object.entries(schema)) {
    if (type === 'integer') next[key] = ''
    else if (key === 'values' || key === 'mimeTypes') next[key] = ''
    else next[key] = ''
  }
  return next
}

export function missingRuleParamKeys(
  schema: ParamSchema,
  values: Record<string, string>
): string[] {
  if (!schema) return []
  return Object.entries(schema)
    .filter(([key, type]) => {
      const raw = (values[key] ?? '').trim()
      if (!raw) return true
      if (type === 'integer') return !Number.isFinite(Number(raw))
      return false
    })
    .map(([key]) => key)
}

export function coerceRuleParamJson(
  schema: ParamSchema,
  values: Record<string, string>
): unknown {
  if (!schema) return null
  const out: Record<string, unknown> = {}
  for (const [key, type] of Object.entries(schema)) {
    const raw = (values[key] ?? '').trim()
    if (type === 'integer') {
      const n = Number(raw)
      if (!raw || !Number.isFinite(n)) continue
      out[key] = Math.trunc(n)
    } else if (key === 'values' || key === 'mimeTypes') {
      out[key] = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (raw) {
      out[key] = raw
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

export function paramsToFormValues(schema: ParamSchema, json: unknown): Record<string, string> {
  const empty = emptyParamsForSchema(schema) ?? {}
  const src = json && typeof json === 'object' && !Array.isArray(json) ? (json as Record<string, unknown>) : {}
  const out: Record<string, string> = {}
  for (const key of Object.keys(empty)) {
    const v = src[key]
    if (Array.isArray(v)) out[key] = v.map(String).join(', ')
    else if (v == null) out[key] = ''
    else out[key] = String(v)
  }
  return out
}
