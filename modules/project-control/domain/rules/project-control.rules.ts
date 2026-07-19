import { BaselineStatus, ChangeRequestStatus } from '../enums/project-control.enum'
import type { ChangeRequest, ProjectBaseline } from '../model/project-control'

export function baselineStatusLabel(status: string): string {
  switch (status) {
    case BaselineStatus.Draft:
      return 'Draft'
    case BaselineStatus.Validated:
      return 'Validated'
    case BaselineStatus.Approved:
      return 'Approved'
    case BaselineStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function baselineStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'progress' {
  switch (status) {
    case BaselineStatus.Approved:
      return 'success'
    case BaselineStatus.Validated:
      return 'progress'
    case BaselineStatus.Draft:
      return 'info'
    case BaselineStatus.Archived:
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function canEditBaseline(b: ProjectBaseline): boolean {
  return b.status === BaselineStatus.Draft && !b.archivedAt
}

export function canValidateBaseline(b: ProjectBaseline): boolean {
  return b.status === BaselineStatus.Draft
}

export function canApproveBaseline(b: ProjectBaseline): boolean {
  return b.status === BaselineStatus.Validated || b.status === BaselineStatus.Draft
}

export function canMarkBaselineCurrent(b: ProjectBaseline): boolean {
  return b.status === BaselineStatus.Approved && !b.currentFlag
}

export function crStatusLabel(status: string): string {
  switch (status) {
    case ChangeRequestStatus.Draft:
      return 'Draft'
    case ChangeRequestStatus.Submitted:
      return 'Submitted'
    case ChangeRequestStatus.Approved:
      return 'Approved'
    case ChangeRequestStatus.Rejected:
      return 'Rejected'
    case ChangeRequestStatus.Cancelled:
      return 'Cancelled'
    case ChangeRequestStatus.Applied:
      return 'Applied'
    case ChangeRequestStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function crStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'progress' {
  switch (status) {
    case ChangeRequestStatus.Draft:
      return 'info'
    case ChangeRequestStatus.Submitted:
      return 'progress'
    case ChangeRequestStatus.Approved:
    case ChangeRequestStatus.Applied:
      return 'success'
    case ChangeRequestStatus.Rejected:
    case ChangeRequestStatus.Cancelled:
      return 'error'
    case ChangeRequestStatus.Archived:
      return 'neutral'
    default:
      return 'neutral'
  }
}

export function canEditChangeRequest(cr: ChangeRequest): boolean {
  return cr.status === ChangeRequestStatus.Draft
}

export function canSubmitChangeRequest(cr: ChangeRequest): boolean {
  return cr.status === ChangeRequestStatus.Draft
}

export function canApproveChangeRequest(cr: ChangeRequest): boolean {
  return cr.status === ChangeRequestStatus.Submitted
}

export function canRejectChangeRequest(cr: ChangeRequest): boolean {
  return cr.status === ChangeRequestStatus.Submitted
}

export function canApplyChangeRequest(cr: ChangeRequest): boolean {
  return cr.status === ChangeRequestStatus.Approved
}

export function changeTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function priorityTone(
  priority: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (priority) {
    case 'CRITICAL':
    case 'HIGH':
      return 'error'
    case 'MEDIUM':
      return 'warning'
    case 'LOW':
      return 'neutral'
    default:
      return 'info'
  }
}

/** Loose helpers for JSON summary/validation when typed DTO is absent. */
export function readSummaryNumber(
  summary: unknown,
  keys: string[]
): number | null {
  if (!summary || typeof summary !== 'object') return null
  const obj = summary as Record<string, unknown>
  for (const key of keys) {
    const v = obj[key]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
  }
  return null
}

export function readValidationItems(validation: unknown): Array<{
  id: string
  label: string
  ok: boolean
  message?: string
}> {
  if (!validation) return []
  if (Array.isArray(validation)) {
    return validation.map((item, i) => {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        return {
          id: String(o.id ?? i),
          label: String(o.label ?? o.check ?? o.name ?? `Check ${i + 1}`),
          ok: Boolean(o.ok ?? o.passed ?? o.valid ?? false),
          message: o.message != null ? String(o.message) : undefined,
        }
      }
      return { id: String(i), label: String(item), ok: false }
    })
  }
  if (typeof validation === 'object') {
    const o = validation as Record<string, unknown>
    if (Array.isArray(o.checks)) return readValidationItems(o.checks)
    if (Array.isArray(o.items)) return readValidationItems(o.items)
  }
  return []
}
