/**
 * Split gantt / phase titles so the left column shows a scannable primary name
 * instead of a repeated prefix like "Implement Module: …".
 */

const PREFIX_BEFORE_COLON = /^(.{2,40}?):\s+(.+)$/

export interface PhaseDisplayParts {
  /** Short name users scan for (e.g. Notifications & Common Services) */
  primary: string
  /** Code / type line (e.g. PH-06 · In Progress) */
  secondary: string | null
  code: string | null
  /** Full original title for tooltips */
  fullTitle: string
}

export function stripPhaseNamePrefix(name: string): string {
  const trimmed = name.trim()
  const m = PREFIX_BEFORE_COLON.exec(trimmed)
  if (m && m[2]) return m[2].trim()
  return trimmed
}

export function resolvePhaseDisplay(input: {
  ganttTitle: string
  code?: string | null
  name?: string | null
  statusLabel?: string | null
}): PhaseDisplayParts {
  const fullTitle = input.ganttTitle.trim()
  const code = input.code?.trim() || null
  const rawName = (input.name ?? fullTitle).trim()
  const primary = stripPhaseNamePrefix(rawName) || fullTitle
  const statusBit = input.statusLabel?.trim() || null

  const secondaryParts: string[] = []
  if (code) secondaryParts.push(code)
  if (statusBit) secondaryParts.push(statusBit)

  return {
    primary,
    secondary: secondaryParts.length ? secondaryParts.join(' · ') : null,
    code,
    fullTitle: fullTitle || primary,
  }
}

export function formatTimelineShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTimelineCompactRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return ''
  if (start && end) {
    return `${formatTimelineShortDate(start)}–${formatTimelineShortDate(end)}`
  }
  return formatTimelineShortDate(start ?? end)
}
