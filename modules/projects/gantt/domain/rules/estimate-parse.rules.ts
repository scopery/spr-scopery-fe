/**
 * Parse human estimate strings into hours.
 * Accepts: `8`, `8h`, `2d`, `3.5h`, `1.5d` (1d = 8h).
 */
export function parseEstimateHours(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (!s) return null

  const dayMatch = /^(\d+(?:\.\d+)?)d$/.exec(s)
  if (dayMatch) {
    const days = Number(dayMatch[1])
    return Number.isFinite(days) && days > 0 ? days * 8 : null
  }

  const hourMatch = /^(\d+(?:\.\d+)?)h?$/.exec(s)
  if (hourMatch) {
    const hours = Number(hourMatch[1])
    return Number.isFinite(hours) && hours > 0 ? hours : null
  }

  return null
}

export function formatEstimateHours(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours)) return ''
  if (hours >= 8 && hours % 8 === 0) return `${hours / 8}d`
  if (Number.isInteger(hours)) return `${hours}h`
  return `${hours}h`
}
