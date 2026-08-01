/**
 * Shared JSON import validation — parse + field checks before any BE call.
 * Domain modules supply item validators; this module owns paths, UUID/enum helpers,
 * and issue formatting.
 */

export interface JsonImportIssue {
  /** JSONPath-like pointer, e.g. `items[0].title` or `items[2].steps[1].action`. */
  path: string
  message: string
}

export type JsonImportValidationResult<T> =
  | { ok: true; items: T[]; issues: [] }
  | { ok: false; items?: undefined; issues: JsonImportIssue[] }

export interface ParseJsonImportResult {
  ok: boolean
  items: Record<string, unknown>[]
  issues: JsonImportIssue[]
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  )
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function readString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return null
}

export function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Parse `{ "items": [...] }` or a bare array. Collects structural issues (does not throw). */
export function parseJsonImportText(text: string): ParseJsonImportResult {
  const raw = text.trim()
  const issues: JsonImportIssue[] = []
  if (!raw) {
    return {
      ok: false,
      items: [],
      issues: [{ path: '', message: 'JSON payload is empty.' }],
    }
  }
  if (raw[0] !== '{' && raw[0] !== '[') {
    return {
      ok: false,
      items: [],
      issues: [
        {
          path: '',
          message: 'Payload must be JSON object `{ "items": [...] }` or a bare array `[...]`.',
        },
      ],
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    return {
      ok: false,
      items: [],
      issues: [
        {
          path: '',
          message: `Invalid JSON: ${err instanceof Error ? err.message : 'parse error'}`,
        },
      ],
    }
  }

  let list: unknown[]
  if (Array.isArray(parsed)) {
    list = parsed
  } else {
    const root = asRecord(parsed)
    if (!root) {
      return {
        ok: false,
        items: [],
        issues: [{ path: '', message: 'Root must be an object or an array.' }],
      }
    }
    if (!('items' in root)) {
      return {
        ok: false,
        items: [],
        issues: [
          {
            path: '',
            message: 'Root object must include an "items" array (or use a bare array).',
          },
        ],
      }
    }
    if (!Array.isArray(root.items)) {
      return {
        ok: false,
        items: [],
        issues: [{ path: 'items', message: '"items" must be an array.' }],
      }
    }
    list = root.items
  }

  if (list.length === 0) {
    return {
      ok: false,
      items: [],
      issues: [{ path: 'items', message: '"items" must contain at least one object.' }],
    }
  }

  const items: Record<string, unknown>[] = []
  list.forEach((entry, index) => {
    const rec = asRecord(entry)
    if (!rec) {
      issues.push({
        path: `items[${index}]`,
        message: 'Each item must be a JSON object.',
      })
      return
    }
    items.push(rec)
  })

  if (issues.length > 0) {
    return { ok: false, items: [], issues }
  }
  return { ok: true, items, issues: [] }
}

export function assertMaxItems(
  count: number,
  maxItems: number | undefined,
  issues: JsonImportIssue[]
): void {
  if (maxItems != null && count > maxItems) {
    issues.push({
      path: 'items',
      message: `Too many items (${count}). Maximum is ${maxItems} per import.`,
    })
  }
}

export function itemPath(index: number, field?: string): string {
  return field ? `items[${index}].${field}` : `items[${index}]`
}

export function requireNonEmptyString(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[],
  label = key
): string | null {
  if (!(key in row) || row[key] == null) {
    issues.push({ path, message: `${label} is required.` })
    return null
  }
  if (typeof row[key] === 'object') {
    issues.push({ path, message: `${label} must be a string, not an object/array.` })
    return null
  }
  const value = readString(row[key])
  if (!value) {
    issues.push({ path, message: `${label} is required and cannot be blank.` })
    return null
  }
  return value
}

export function optionalString(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[],
  label = key
): string | null {
  if (!(key in row) || row[key] == null) return null
  if (typeof row[key] === 'object') {
    issues.push({ path, message: `${label} must be a string when provided.` })
    return null
  }
  const value = readString(row[key])
  return value || null
}

export function requireUuid(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[],
  label = key
): string | null {
  const value = requireNonEmptyString(row, key, path, issues, label)
  if (!value) return null
  if (!isUuid(value)) {
    issues.push({ path, message: `${label} must be a valid UUID.` })
    return null
  }
  return value
}

export function optionalUuid(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[],
  label = key
): string | null {
  const value = optionalString(row, key, path, issues, label)
  if (!value) return null
  if (!isUuid(value)) {
    issues.push({ path, message: `${label} must be a valid UUID when provided.` })
    return null
  }
  return value
}

/**
 * If the field is present and non-empty, it MUST be one of `allowed` (exact match after trim+upper).
 * Missing/blank → null (caller applies default if needed).
 */
export function optionalEnum(
  row: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
  path: string,
  issues: JsonImportIssue[],
  label = key
): string | null {
  if (!(key in row) || row[key] == null || row[key] === '') return null
  if (typeof row[key] === 'object') {
    issues.push({ path, message: `${label} must be a string enum value.` })
    return null
  }
  const raw = readString(row[key])
  if (!raw) return null
  const normalized = raw.toUpperCase().replace(/\s+/g, '_')
  if (!allowed.includes(normalized) && !allowed.includes(raw)) {
    issues.push({
      path,
      message: `${label} must be one of: ${allowed.join(', ')}. Got "${raw}".`,
    })
    return null
  }
  return allowed.includes(normalized) ? normalized : raw
}

export function requireEnum(
  row: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
  path: string,
  issues: JsonImportIssue[],
  label = key
): string | null {
  const value = requireNonEmptyString(row, key, path, issues, label)
  if (!value) return null
  const normalized = value.toUpperCase().replace(/\s+/g, '_')
  if (!allowed.includes(normalized) && !allowed.includes(value)) {
    issues.push({
      path,
      message: `${label} must be one of: ${allowed.join(', ')}. Got "${value}".`,
    })
    return null
  }
  return allowed.includes(normalized) ? normalized : value
}

export function optionalNumberField(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[],
  opts?: { integer?: boolean; min?: number; label?: string }
): number | null {
  const label = opts?.label ?? key
  if (!(key in row) || row[key] == null || row[key] === '') return null
  const n = readNumber(row[key])
  if (n == null) {
    issues.push({ path, message: `${label} must be a number.` })
    return null
  }
  if (opts?.integer && !Number.isInteger(n)) {
    issues.push({ path, message: `${label} must be an integer.` })
    return null
  }
  if (opts?.min != null && n < opts.min) {
    issues.push({ path, message: `${label} must be ≥ ${opts.min}.` })
    return null
  }
  return n
}

export function optionalIsoDateField(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[],
  label = key
): string | null {
  const value = optionalString(row, key, path, issues, label)
  if (!value) return null
  if (!isIsoDate(value)) {
    issues.push({ path, message: `${label} must be an ISO date (YYYY-MM-DD).` })
    return null
  }
  return value
}

export function optionalStringArray(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[],
  label = key
): string[] | null {
  if (!(key in row) || row[key] == null) return null
  if (!Array.isArray(row[key])) {
    issues.push({ path, message: `${label} must be an array of strings.` })
    return null
  }
  const out: string[] = []
  ;(row[key] as unknown[]).forEach((entry, i) => {
    if (typeof entry === 'object' && entry != null) {
      issues.push({
        path: `${path}[${i}]`,
        message: `${label} entries must be strings.`,
      })
      return
    }
    const s = readString(entry)
    if (s) out.push(s)
  })
  return out
}

/** Reject unknown top-level keys (helps catch typos before BE). */
export function rejectUnknownKeys(
  row: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  itemIndex: number,
  issues: JsonImportIssue[]
): void {
  for (const key of Object.keys(row)) {
    if (!allowed.has(key)) {
      issues.push({
        path: itemPath(itemIndex, key),
        message: `Unknown field "${key}". Allowed: ${[...allowed].join(', ')}.`,
      })
    }
  }
}

export function flagDuplicateStrings(
  values: Array<{ index: number; value: string; field: string }>,
  issues: JsonImportIssue[]
): void {
  const seen = new Map<string, number>()
  for (const { index, value, field } of values) {
    const key = `${field}:${value.toLowerCase()}`
    const first = seen.get(key)
    if (first != null) {
      issues.push({
        path: itemPath(index, field),
        message: `Duplicate ${field} "${value}" (also on items[${first}]).`,
      })
    } else {
      seen.set(key, index)
    }
  }
}

export function formatJsonImportIssues(issues: JsonImportIssue[], limit = 20): string {
  if (issues.length === 0) return ''
  const lines = issues.slice(0, limit).map((issue) => {
    const prefix = issue.path ? `${issue.path}: ` : ''
    return `• ${prefix}${issue.message}`
  })
  if (issues.length > limit) {
    lines.push(`• …and ${issues.length - limit} more issue${issues.length - limit === 1 ? '' : 's'}`)
  }
  return lines.join('\n')
}

export function failIssues<T>(issues: JsonImportIssue[]): JsonImportValidationResult<T> {
  return { ok: false, issues }
}

export function okItems<T>(items: T[]): JsonImportValidationResult<T> {
  return { ok: true, items, issues: [] }
}

/**
 * Run parse → max check → item mapper. Mapper pushes into `issues` and returns null on failure.
 */
export function validateJsonImportItems<T>(
  rawItems: Record<string, unknown>[],
  options: {
    maxItems?: number
    mapItem: (row: Record<string, unknown>, index: number, issues: JsonImportIssue[]) => T | null
    afterAll?: (mapped: T[], issues: JsonImportIssue[]) => void
  }
): JsonImportValidationResult<T> {
  const issues: JsonImportIssue[] = []
  assertMaxItems(rawItems.length, options.maxItems, issues)
  if (issues.length > 0) return failIssues(issues)

  const mapped: T[] = []
  rawItems.forEach((row, index) => {
    const item = options.mapItem(row, index, issues)
    if (item != null) mapped.push(item)
  })

  options.afterAll?.(mapped, issues)

  if (issues.length > 0) return failIssues(issues)
  if (mapped.length === 0) {
    return failIssues([{ path: 'items', message: 'No valid items to import.' }])
  }
  return okItems(mapped)
}
