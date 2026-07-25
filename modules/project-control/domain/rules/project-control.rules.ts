import {
  BaselineStatus,
  ChangeItemOperation,
  ChangeRequestStatus,
} from '../enums/project-control.enum'
import type {
  ChangeImpact,
  ChangeRequest,
  ChangeRequestItem,
  ProjectBaseline,
} from '../model/project-control'

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

export type CrWorkflowPhase = 'details' | 'changes' | 'impact' | 'review'

export function priorityLabel(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return 'Critical'
    case 'HIGH':
      return 'High'
    case 'MEDIUM':
      return 'Medium'
    case 'LOW':
      return 'Low'
    default:
      return priority
  }
}

export function changeItemOperationLabel(operation: string): string {
  switch (operation) {
    case ChangeItemOperation.Add:
      return 'New'
    case ChangeItemOperation.Modify:
      return 'Modify'
    case ChangeItemOperation.Remove:
      return 'Remove'
    default:
      return operation
  }
}

export function changeItemTargetLabel(targetType: string): string {
  const normalized = targetType.trim().toUpperCase()
  switch (normalized) {
    case 'FUNCTION':
      return 'Function'
    case 'TASK':
      return 'Task'
    case 'SCHEDULE':
      return 'Schedule'
    case 'STAFFING':
      return 'Staffing'
    default:
      return targetType.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  }
}

export function affectedAreaLabel(area: string): string {
  switch (area) {
    case 'ACCEPTANCE_CRITERIA':
      return 'Acceptance criteria'
    case 'BUSINESS_RULES':
      return 'Business rules'
    case 'SCREENS':
      return 'Screens'
    case 'API':
      return 'APIs'
    case 'DATA':
      return 'Data'
    case 'ESTIMATE':
      return 'Estimate'
    case 'DATES':
      return 'Dates'
    case 'ASSIGNMENT':
      return 'Assignment'
    default:
      return area.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  }
}

/** What the user still needs before Submit for review (Draft only). */
export function getCrSubmitBlockers(
  cr: ChangeRequest,
  items: ChangeRequestItem[],
  impact: ChangeImpact | null
): string[] {
  if (cr.status !== ChangeRequestStatus.Draft) return []
  const blockers: string[] = []
  if (!cr.reason.trim()) blockers.push('Reason for change')
  if (items.length === 0) blockers.push('At least one proposed change')
  if (!impact) blockers.push('Impact analysis')
  return blockers
}

export function isCrReadyToSubmit(
  cr: ChangeRequest,
  items: ChangeRequestItem[],
  impact: ChangeImpact | null
): boolean {
  return (
    canSubmitChangeRequest(cr) && getCrSubmitBlockers(cr, items, impact).length === 0
  )
}

export function getCrWorkflowPhase(
  cr: ChangeRequest,
  items: ChangeRequestItem[],
  impact: ChangeImpact | null
): CrWorkflowPhase {
  if (cr.status !== ChangeRequestStatus.Draft) return 'review'
  if (!cr.reason.trim()) return 'details'
  if (items.length === 0) return 'changes'
  if (!impact) return 'impact'
  return 'review'
}

export function getCrNextStepHint(
  cr: ChangeRequest,
  items: ChangeRequestItem[],
  impact: ChangeImpact | null
): string {
  if (cr.status === ChangeRequestStatus.Submitted) {
    return 'Waiting for approval.'
  }
  if (cr.status === ChangeRequestStatus.Approved) {
    return 'Apply the change request, or review the implementation plan.'
  }
  if (cr.status === ChangeRequestStatus.Applied) {
    return 'This change request has been applied.'
  }
  if (
    cr.status === ChangeRequestStatus.Rejected ||
    cr.status === ChangeRequestStatus.Cancelled ||
    cr.status === ChangeRequestStatus.Archived
  ) {
    return 'No further action on this change request.'
  }

  const phase = getCrWorkflowPhase(cr, items, impact)
  switch (phase) {
    case 'details':
      return 'Complete the request details (reason and outcome).'
    case 'changes':
      return 'Add at least one proposed change.'
    case 'impact':
      return 'Run impact analysis.'
    case 'review':
      return 'Review the summary, then submit for review.'
  }
}

export function shouldShowImplementationPlan(cr: ChangeRequest): boolean {
  return (
    cr.status === ChangeRequestStatus.Approved ||
    cr.status === ChangeRequestStatus.Applied ||
    cr.status === ChangeRequestStatus.Archived
  )
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
