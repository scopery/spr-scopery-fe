/** WAVE4 requirement lifecycle: DRAFT → APPROVED | REJECTED | DEFERRED → IMPLEMENTED (+ ARCHIVED). */

export const RequirementStatus = {
  Draft: 'DRAFT',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Deferred: 'DEFERRED',
  Implemented: 'IMPLEMENTED',
  Archived: 'ARCHIVED',
} as const

export type RequirementStatus = (typeof RequirementStatus)[keyof typeof RequirementStatus]

export type RequirementStatusTone =
  | 'neutral'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'primary'
  | 'default'

export type RequirementStatusBadgeProps = {
  variant: 'solid' | 'soft'
  tone: RequirementStatusTone
  className?: string
}

/** Editable lifecycle statuses (archive stays on dedicated Archive action). */
export const REQUIREMENT_STATUS_EDIT_OPTIONS: { value: RequirementStatus; label: string }[] = [
  { value: RequirementStatus.Draft, label: 'Draft' },
  { value: RequirementStatus.Approved, label: 'Approved' },
  { value: RequirementStatus.Rejected, label: 'Rejected' },
  { value: RequirementStatus.Deferred, label: 'Deferred' },
  { value: RequirementStatus.Implemented, label: 'Implemented' },
]

export function normalizeRequirementStatus(
  raw: string | null | undefined
): RequirementStatus {
  const v = (raw ?? '').toUpperCase()
  if ((Object.values(RequirementStatus) as string[]).includes(v)) {
    return v as RequirementStatus
  }
  return RequirementStatus.Draft
}

export function requirementStatusLabel(status: string | null | undefined): string {
  switch (normalizeRequirementStatus(status)) {
    case RequirementStatus.Draft:
      return 'Draft'
    case RequirementStatus.Approved:
      return 'Approved'
    case RequirementStatus.Rejected:
      return 'Rejected'
    case RequirementStatus.Deferred:
      return 'Deferred'
    case RequirementStatus.Implemented:
      return 'Implemented'
    case RequirementStatus.Archived:
      return 'Archived'
    default:
      return status?.trim() || 'Draft'
  }
}

/**
 * Badge props for status chips.
 * Draft = soft gray-100 + black text; others stay solid semantic tones.
 */
export function requirementStatusBadgeProps(
  status: string | null | undefined
): RequirementStatusBadgeProps {
  switch (normalizeRequirementStatus(status)) {
    case RequirementStatus.Approved:
      return { variant: 'solid', tone: 'success' }
    case RequirementStatus.Rejected:
      return { variant: 'solid', tone: 'error' }
    case RequirementStatus.Deferred:
      return { variant: 'solid', tone: 'warning' }
    case RequirementStatus.Implemented:
      return { variant: 'solid', tone: 'primary' }
    case RequirementStatus.Archived:
      return { variant: 'solid', tone: 'neutral' }
    case RequirementStatus.Draft:
    default:
      // soft/default → bg-neutral-100 text-neutral-900; font matches solid status chips
      return { variant: 'soft', tone: 'default', className: 'font-calsans' }
  }
}

export function requirementStatusTone(status: string | null | undefined): RequirementStatusTone {
  return requirementStatusBadgeProps(status).tone
}

/**
 * BE locks requirement body for Approved / Archived.
 * Rejected, Deferred, Implemented stay content-editable; Draft always editable.
 */
export function isRequirementContentImmutable(status: string | null | undefined): boolean {
  const s = normalizeRequirementStatus(status)
  return s === RequirementStatus.Approved || s === RequirementStatus.Archived
}
