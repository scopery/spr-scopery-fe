/** Safe extractors for untyped report / dashboard Map payloads. */

export function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function num(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return null
}

export function str(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number') return String(value)
  return null
}

export function bool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  return null
}

export function firstNum(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = num(row[key])
    if (value != null) return value
  }
  return null
}

export function firstStr(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = str(row[key])
    if (value != null) return value
  }
  return null
}

export function hasMeaningfulPayload(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false
  return Object.keys(row).length > 0
}

export function formatPercent(value: number | null): string | null {
  if (value == null) return null
  return `${Math.round(value)}%`
}

export function formatSignedDays(value: number | null): string | null {
  if (value == null) return null
  const sign = value > 0 ? '+' : ''
  return `${sign}${value} working days`
}

export function formatSignedNumber(value: number | null, suffix = ''): string | null {
  if (value == null) return null
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}${suffix}`
}
