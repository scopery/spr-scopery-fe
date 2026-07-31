import {
  CaseLifecycleStatus,
  DefectWorkflowStatus,
  TestExecutionResult,
  TestRunStatus,
  ReleaseReadinessStatus,
} from '../enums/quality.enum'
import type { ComparisonOperator } from '../enums/quality.enum'
import type { RunCompletionValidation } from '../model/quality'

export type CaseLifecycleAction = 'ready' | 'deprecate' | 'archive' | 'restore'
export type RunLifecycleAction = 'plan' | 'start' | 'complete' | 'cancel' | 'reopen'
export type DefectLifecycleAction =
  | 'start'
  | 'resolve'
  | 'retest'
  | 'close'
  | 'reject'
  | 'reopen'

const CASE_ALLOWED: Record<string, CaseLifecycleAction[]> = {
  [CaseLifecycleStatus.Draft]: ['ready', 'archive'],
  [CaseLifecycleStatus.Ready]: ['deprecate', 'archive'],
  [CaseLifecycleStatus.Deprecated]: ['restore', 'archive'],
  [CaseLifecycleStatus.Archived]: ['restore'],
  // Legacy Approved maps to Ready-like actions
  APPROVED: ['deprecate', 'archive'],
}

const RUN_ALLOWED: Record<string, RunLifecycleAction[]> = {
  [TestRunStatus.Draft]: ['plan', 'start', 'cancel'],
  [TestRunStatus.Planned]: ['start', 'cancel'],
  [TestRunStatus.InProgress]: ['complete', 'cancel'],
  [TestRunStatus.Completed]: ['reopen'],
  [TestRunStatus.Cancelled]: ['reopen'],
}

const DEFECT_ALLOWED: Record<string, DefectLifecycleAction[]> = {
  [DefectWorkflowStatus.Open]: ['start', 'reject', 'close'],
  [DefectWorkflowStatus.InProgress]: ['resolve', 'reject', 'close'],
  [DefectWorkflowStatus.Resolved]: ['retest', 'close', 'reopen'],
  [DefectWorkflowStatus.Retest]: ['close', 'reopen', 'resolve'],
  [DefectWorkflowStatus.Closed]: ['reopen'],
  [DefectWorkflowStatus.Rejected]: ['reopen'],
  // Richer BE statuses mapped into workflow
  TRIAGED: ['start', 'reject', 'close'],
  ASSIGNED: ['start', 'reject', 'close'],
  FIXED: ['retest', 'close', 'reopen'],
  READY_FOR_RETEST: ['retest', 'close', 'reopen'],
  RETESTING: ['close', 'reopen', 'resolve'],
  VERIFIED: ['close', 'reopen'],
  REOPENED: ['start', 'reject', 'close'],
}

export function normalizeCaseLifecycleStatus(status: string): string {
  if (status === 'APPROVED') return CaseLifecycleStatus.Ready
  return status
}

export function allowedCaseLifecycleActions(status: string): CaseLifecycleAction[] {
  return CASE_ALLOWED[normalizeCaseLifecycleStatus(status)] ?? CASE_ALLOWED[status] ?? []
}

export function canRunCaseLifecycle(status: string, action: CaseLifecycleAction): boolean {
  return allowedCaseLifecycleActions(status).includes(action)
}

export function allowedRunLifecycleActions(status: string): RunLifecycleAction[] {
  return RUN_ALLOWED[status] ?? []
}

export function canRunLifecycle(status: string, action: RunLifecycleAction): boolean {
  return allowedRunLifecycleActions(status).includes(action)
}

const TEST_RUN_STATUS_LABELS: Record<string, string> = {
  [TestRunStatus.Draft]: 'Draft',
  [TestRunStatus.Planned]: 'Planned',
  [TestRunStatus.InProgress]: 'In progress',
  [TestRunStatus.Completed]: 'Completed',
  [TestRunStatus.Cancelled]: 'Cancelled',
}

export function testRunStatusLabel(status: string): string {
  return (
    TEST_RUN_STATUS_LABELS[status] ??
    status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  )
}

export function caseKindLabel(kind: string, qualityAttribute?: string | null): string {
  if (kind === 'NFR') {
    if (qualityAttribute?.trim()) return qualityAttribute.trim()
    return 'NFR verification'
  }
  if (kind === 'FUNCTIONAL') return 'Functional'
  return kind
}

export function allowedDefectLifecycleActions(status: string): DefectLifecycleAction[] {
  const mapped = mapDefectStatusToWorkflow(status)
  return DEFECT_ALLOWED[status] ?? DEFECT_ALLOWED[mapped] ?? []
}

export function defectLifecycleActionLabel(action: DefectLifecycleAction): string {
  const labels: Record<DefectLifecycleAction, string> = {
    start: 'Start',
    resolve: 'Mark fixed',
    retest: 'Ready for retest',
    close: 'Close',
    reject: 'Reject',
    reopen: 'Reopen',
  }
  return labels[action] ?? action
}

export function defectStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Open',
    TRIAGED: 'Triaged',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In progress',
    FIXED: 'Fixed',
    RESOLVED: 'Resolved',
    READY_FOR_RETEST: 'Ready for retest',
    RETEST: 'Retest',
    RETESTING: 'Retesting',
    VERIFIED: 'Verified',
    CLOSED: 'Closed',
    REJECTED: 'Rejected',
    REOPENED: 'Reopened',
    ARCHIVED: 'Archived',
  }
  return labels[status] ?? labels[mapDefectStatusToWorkflow(status)] ?? status
}

export function testExecutionResultLabel(result: string): string {
  const labels: Record<string, string> = {
    NOT_RUN: 'Not run',
    PASSED: 'Passed',
    FAILED: 'Failed',
    BLOCKED: 'Blocked',
    SKIPPED: 'Skipped',
  }
  return (
    labels[result] ??
    result.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  )
}

/** Compact one-line provenance for Defects table. */
export function defectSourceSummary(source: {
  testRunName?: string | null
  caseCode?: string | null
  caseTitle?: string | null
} | null | undefined): string {
  if (!source) return '—'
  const casePart = [source.caseCode, source.caseTitle].filter(Boolean).join(' · ')
  if (source.testRunName && casePart) return `${source.testRunName} → ${casePart}`
  return source.testRunName || casePart || 'Linked result'
}

export function canRunDefectLifecycle(status: string, action: DefectLifecycleAction): boolean {
  return allowedDefectLifecycleActions(status).includes(action)
}

export function resultRequiresReason(result: string): boolean {
  return result === TestExecutionResult.Failed || result === TestExecutionResult.Blocked
}

export function validateResultUpdate(input: {
  result: string
  notes?: string | null
}): { ok: true } | { ok: false; message: string } {
  if (resultRequiresReason(input.result) && !input.notes?.trim()) {
    return {
      ok: false,
      message: `${input.result === TestExecutionResult.Failed ? 'Failed' : 'Blocked'} results require a reason.`,
    }
  }
  return { ok: true }
}

export function evaluateThreshold(input: {
  operator: ComparisonOperator | string | null | undefined
  thresholdValue: number | null | undefined
  secondaryThresholdValue?: number | null
  actualValue: number | null | undefined
}): boolean | null {
  if (input.actualValue == null || input.thresholdValue == null || !input.operator) return null
  const actual = input.actualValue
  const target = input.thresholdValue
  const secondary = input.secondaryThresholdValue
  switch (input.operator) {
    case 'LT':
      return actual < target
    case 'LTE':
      return actual <= target
    case 'GT':
      return actual > target
    case 'GTE':
      return actual >= target
    case 'EQ':
      return actual === target
    case 'BETWEEN':
      if (secondary == null) return null
      return actual >= Math.min(target, secondary) && actual <= Math.max(target, secondary)
    default:
      return null
  }
}

export function buildRunCompletionValidation(input: {
  runId: string
  counts: {
    total: number
    passed: number
    failed: number
    blocked: number
    skipped: number
    notRun: number
  }
  requireNoNotRun?: boolean
  requireNoFailed?: boolean
}): RunCompletionValidation {
  const violations: RunCompletionValidation['violations'] = []
  if (input.requireNoNotRun !== false && input.counts.notRun > 0) {
    violations.push({
      code: 'NOT_RUN_REMAINING',
      message: `${input.counts.notRun} case(s) have not been executed.`,
      severity: 'HIGH',
    })
  }
  if (input.requireNoFailed !== false && input.counts.failed > 0) {
    violations.push({
      code: 'FAILED_REMAINING',
      message: `${input.counts.failed} case(s) failed.`,
      severity: 'CRITICAL',
    })
  }
  if (input.counts.blocked > 0) {
    violations.push({
      code: 'BLOCKED_REMAINING',
      message: `${input.counts.blocked} case(s) are blocked.`,
      severity: 'HIGH',
    })
  }
  return {
    runId: input.runId,
    canComplete: violations.length === 0,
    totalCount: input.counts.total,
    passedCount: input.counts.passed,
    failedCount: input.counts.failed,
    blockedCount: input.counts.blocked,
    skippedCount: input.counts.skipped,
    notRunCount: input.counts.notRun,
    violations,
  }
}

export function canOverrideReleaseReadiness(input: {
  readinessStatus: string
  hasPermission: boolean
  reason?: string | null
  approverUserId?: string | null
}): { ok: true } | { ok: false; message: string } {
  if (!input.hasPermission) {
    return { ok: false, message: 'Missing permission to override release readiness.' }
  }
  if (
    input.readinessStatus === ReleaseReadinessStatus.Ready ||
    input.readinessStatus === ReleaseReadinessStatus.Released
  ) {
    return { ok: false, message: 'Override is not applicable for ready/released releases.' }
  }
  if (!input.reason?.trim()) {
    return { ok: false, message: 'Override requires a reason.' }
  }
  if (!input.approverUserId?.trim()) {
    return { ok: false, message: 'Override requires an approver.' }
  }
  return { ok: true }
}

export function mapDefectStatusToWorkflow(status: string): string {
  switch (status) {
    case 'OPEN':
    case 'TRIAGED':
    case 'ASSIGNED':
    case 'REOPENED':
      return DefectWorkflowStatus.Open
    case 'IN_PROGRESS':
      return DefectWorkflowStatus.InProgress
    case 'FIXED':
    case 'VERIFIED':
      return DefectWorkflowStatus.Resolved
    case 'READY_FOR_RETEST':
    case 'RETESTING':
      return DefectWorkflowStatus.Retest
    case 'CLOSED':
    case 'ARCHIVED':
      return DefectWorkflowStatus.Closed
    case 'REJECTED':
      return DefectWorkflowStatus.Rejected
    default:
      return status
  }
}
