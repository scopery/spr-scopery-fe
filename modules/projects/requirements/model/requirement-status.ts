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

export type RequirementStatusTone = 'neutral' | 'success' | 'error' | 'warning' | 'info' | 'primary'

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

export function requirementStatusTone(status: string | null | undefined): RequirementStatusTone {
  switch (normalizeRequirementStatus(status)) {
    case RequirementStatus.Approved:
      return 'success'
    case RequirementStatus.Rejected:
      return 'error'
    case RequirementStatus.Deferred:
      return 'warning'
    case RequirementStatus.Implemented:
      return 'primary'
    case RequirementStatus.Archived:
      return 'neutral'
    case RequirementStatus.Draft:
    default:
      return 'info'
  }
}
