import {
  BaselineStatus,
  ChangeItemOperation,
  ChangeOrderStatus,
  ChangeRequestStatus,
} from '../enums/project-control.enum'
import type {
  ChangeImpact,
  ChangeRequest,
  ChangeRequestItem,
  ProjectBaseline,
} from '../model/project-control'

export function baselineStatusLabel(status: string): string {
  switch (status.trim().toUpperCase()) {
    case BaselineStatus.Draft:
      return 'Draft'
    case BaselineStatus.Validated:
      return 'Validated'
    case BaselineStatus.Approved:
      return 'Approved'
    case BaselineStatus.Archived:
      return 'Archived'
    default:
      return humanizeEnumToken(status)
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
      return 'neutral'
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

/** Draft baselines may re-capture; approved snapshots are immutable history. */
export function canCaptureBaselineSnapshot(b: ProjectBaseline): boolean {
  return b.status === BaselineStatus.Draft && !b.archivedAt
}

export function shouldCreateUpdatedBaseline(b: ProjectBaseline): boolean {
  return (
    !b.archivedAt &&
    (b.status === BaselineStatus.Approved || b.status === BaselineStatus.Validated)
  )
}

export type BaselineViewMode = 'baseline' | 'current' | 'difference'

export interface BaselineSummaryMetrics {
  phaseCount: number | null
  wbsCount: number | null
  taskCount: number | null
  estimateHours: number | null
  cost: number | null
  revenue: number | null
  marginPercent: number | null
  scheduleStart: string | null
  scheduleEnd: string | null
  workingDays: number | null
  currencyCode: string | null
  dependencyCount: number | null
  milestoneCount: number | null
  pbt: number | null
  quoteAmount: number | null
}

export function mapBaselineSummaryToMetrics(
  summary: ProjectBaseline['summary']
): BaselineSummaryMetrics {
  if (!summary) {
    return {
      phaseCount: null,
      wbsCount: null,
      taskCount: null,
      estimateHours: null,
      cost: null,
      revenue: null,
      marginPercent: null,
      scheduleStart: null,
      scheduleEnd: null,
      workingDays: null,
      currencyCode: null,
      dependencyCount: null,
      milestoneCount: null,
      pbt: null,
      quoteAmount: null,
    }
  }
  return {
    phaseCount: summary.phaseCount,
    wbsCount: summary.wbsCount,
    taskCount: summary.taskCount,
    estimateHours: toNullableNumber(summary.estimateHours),
    cost: toNullableNumber(summary.directCost),
    revenue: toNullableNumber(summary.revenue),
    marginPercent: toNullableNumber(summary.targetMarginPercent),
    scheduleStart: summary.plannedStartDate,
    scheduleEnd: summary.plannedEndDate,
    workingDays: null,
    currencyCode: summary.currencyCode,
    dependencyCount: summary.dependencyCount,
    milestoneCount: summary.milestoneCount,
    pbt: toNullableNumber(summary.pbt),
    quoteAmount: toNullableNumber(summary.totalQuotedAmount),
  }
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return null
}

export interface SnapshotTreeNode {
  id: string
  label: string
  meta?: string
  type?: string
  children?: SnapshotTreeNode[]
}

function formatTreeMeta(meta: Record<string, unknown> | null | undefined): string | undefined {
  if (!meta) return undefined
  if (typeof meta.label === 'string' && meta.label.trim()) return meta.label
  if (typeof meta.taskCount === 'number') return `${meta.taskCount} Tasks`
  if (typeof meta.estimateHours === 'number') return `${meta.estimateHours}h`
  return undefined
}

/** Map typed BE projectTree → UI tree nodes. */
export function mapProjectTree(
  tree: ProjectBaseline['projectTree']
): SnapshotTreeNode[] {
  if (!tree || tree.length === 0) return []
  return tree.map((node) => ({
    id: String(node.id),
    label: node.code ? `${node.code} · ${node.name}` : node.name,
    meta: formatTreeMeta(node.meta),
    type: node.type,
    children:
      node.children && node.children.length > 0
        ? mapProjectTree(node.children)
        : undefined,
  }))
}

export interface BaselineHealthSummary {
  snapshotReady: boolean
  snapshotStatus: string
  passed: number
  warnings: number
  blocking: number
  sourcesPresent: number
  sourcesTotal: number
  sourcesLabel: string
  approvalLabel: string
  nextStep: string
  issues: Array<{ id: string; label: string; message?: string }>
  sourceChecks: Array<{ source: string; status: string }>
}

function severityIsBlocking(severity: string | null | undefined): boolean {
  const s = (severity ?? '').toUpperCase()
  return s === 'ERROR' || s === 'BLOCKING' || s === 'CRITICAL'
}

function severityIsWarning(severity: string | null | undefined): boolean {
  const s = (severity ?? '').toUpperCase()
  return s === 'WARNING' || s === 'WARN'
}

export function buildBaselineHealth(b: ProjectBaseline): BaselineHealthSummary {
  const health = b.health
  const issues = health?.issues ?? []
  const blocking = issues.filter((i) => severityIsBlocking(i.severity)).length
  const warnings = issues.filter((i) => severityIsWarning(i.severity)).length
  const passed = Math.max(0, issues.length === 0 && health?.snapshotStatus === 'VALID' ? 1 : 0)

  const sourceChecks = (health?.sources ?? []).map((s) => ({
    source: s.source,
    status: s.status ?? 'UNKNOWN',
  }))
  const sourcesPresent = sourceChecks.filter((s) => {
    const st = s.status.toUpperCase()
    return st && st !== 'MISSING' && st !== 'NOT_APPLICABLE' && st !== 'UNKNOWN'
  }).length
  const sourcesTotal = Math.max(sourceChecks.length, 4)

  const snapshotStatus = health?.snapshotStatus ?? 'MISSING'
  const snapshotReady =
    snapshotStatus.toUpperCase() === 'VALID' ||
    snapshotStatus.toUpperCase() === 'READY' ||
    (b.projectTree != null && b.projectTree.length > 0) ||
    b.summary != null

  let approvalLabel = health?.approval?.status ?? 'Pending'
  if (b.currentFlag) approvalLabel = 'Active baseline'
  else if (b.status === BaselineStatus.Approved) approvalLabel = 'Approved'
  else if (b.status === BaselineStatus.Validated) approvalLabel = 'Validated'
  else if (b.status === BaselineStatus.Archived) approvalLabel = 'Archived'
  else if (b.status === BaselineStatus.Draft) approvalLabel = 'Pending'

  let sourcesLabel = 'Incomplete'
  if (sourceChecks.length === 0) {
    const linked = [
      b.sourceScheduleRunId,
      b.sourceEstimationRunId,
      b.sourceFinanceScenarioId,
      b.sourceQuoteVersionId,
    ].filter(Boolean).length
    if (linked === 0) sourcesLabel = 'Not captured'
    else if (linked === 4) sourcesLabel = 'Up to date'
    else sourcesLabel = `${linked} of 4 linked`
  } else if (sourcesPresent === 0) sourcesLabel = 'Not captured'
  else if (sourcesPresent >= sourcesTotal) sourcesLabel = 'Up to date'
  else sourcesLabel = `${sourcesPresent} of ${sourcesTotal} ready`

  let nextStep = 'Capture the latest project state, then check this baseline.'
  if (!snapshotReady && !b.summary) {
    nextStep = 'Capture the latest project state.'
  } else if (!health || (issues.length === 0 && snapshotStatus === 'DRAFT')) {
    nextStep = 'Check baseline health before approving.'
  } else if (blocking > 0) {
    nextStep = `Resolve ${blocking} blocking issue${blocking === 1 ? '' : 's'}.`
  } else if (warnings > 0) {
    nextStep = `Review ${warnings} warning${warnings === 1 ? '' : 's'}.`
  } else if (canApproveBaseline(b)) {
    nextStep = 'Ready to approve as a reference plan.'
  } else if (canMarkBaselineCurrent(b)) {
    nextStep = 'Use as the active project baseline.'
  } else if (b.currentFlag) {
    nextStep = 'This is the active project baseline.'
  } else {
    nextStep = 'No further action required.'
  }

  return {
    snapshotReady,
    snapshotStatus,
    passed,
    warnings,
    blocking,
    sourcesPresent,
    sourcesTotal,
    sourcesLabel,
    approvalLabel,
    nextStep,
    issues: issues.map((c, i) => ({
      id: c.code ?? `issue-${i}`,
      label: c.code ?? 'Issue',
      message: c.message ?? undefined,
    })),
    sourceChecks,
  }
}

export function formatBaselineCapturedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatMetricNumber(value: number | null, suffix = ''): string {
  if (value == null) return '—'
  const formatted = Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 })
  return `${formatted}${suffix}`
}

export function formatMoneyMetric(
  value: number | null,
  currencyCode?: string | null
): string {
  if (value == null) return '—'
  const code = currencyCode && currencyCode.length === 3 ? currencyCode : 'USD'
  try {
    return value.toLocaleString(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    })
  } catch {
    return `${value.toLocaleString()} ${code}`
  }
}

export function formatDeltaValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'number') return formatMetricNumber(value)
  if (typeof value === 'string') return value
  return String(value)
}

export function crStatusLabel(status: string): string {
  switch (status.trim().toUpperCase()) {
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
      return humanizeEnumToken(status)
  }
}

export function crStatusTone(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'progress' | 'default' {
  switch (status.trim().toUpperCase()) {
    case ChangeRequestStatus.Draft:
      return 'default' // soft: gray bg + black text
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

/** Draft = soft gray/black; other statuses = solid colored chips. */
export function crStatusBadgeVariant(status: string): 'solid' | 'soft' {
  return status.trim().toUpperCase() === ChangeRequestStatus.Draft ? 'soft' : 'solid'
}

export function canEditChangeRequest(cr: ChangeRequest): boolean {
  return cr.status === ChangeRequestStatus.Draft
}

export function canSubmitChangeRequest(cr: ChangeRequest): boolean {
  return cr.status === ChangeRequestStatus.Draft
}

export type CrWorkflowPhase = 'details' | 'changes' | 'impact' | 'review'

/** Sentence-case human label for SCREAMING_SNAKE / mixed tokens — never show raw enums in UI. */
function humanizeEnumToken(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return trimmed
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function priorityLabel(priority: string): string {
  switch (priority.trim().toUpperCase()) {
    case 'CRITICAL':
      return 'Critical'
    case 'HIGH':
      return 'High'
    case 'MEDIUM':
      return 'Medium'
    case 'LOW':
      return 'Low'
    default:
      return humanizeEnumToken(priority)
  }
}

export function changeItemOperationLabel(operation: string): string {
  switch (operation.trim().toUpperCase()) {
    case ChangeItemOperation.Create:
    case 'ADD': // legacy WAVE3 docs / old FE payloads
      return 'New'
    case ChangeItemOperation.Update:
    case 'MODIFY':
      return 'Modify'
    case ChangeItemOperation.Delete:
    case 'REMOVE':
      return 'Remove'
    case ChangeItemOperation.Archive:
      return 'Archive'
    case ChangeItemOperation.Move:
      return 'Move'
    case ChangeItemOperation.Recalculate:
      return 'Recalculate'
    case ChangeItemOperation.ReplaceReference:
      return 'Replace reference'
    default:
      return humanizeEnumToken(operation)
  }
}

export function changeItemTargetLabel(targetType: string): string {
  const normalized = targetType.trim().toUpperCase()
  switch (normalized) {
    case 'PROJECT':
      return 'Project'
    case 'PROJECT_PHASE':
      return 'Project phase'
    case 'WBS_NODE':
      return 'WBS node'
    case 'TASK':
      return 'Task'
    case 'TASK_DEPENDENCY':
      return 'Task dependency'
    case 'MILESTONE':
      return 'Milestone'
    case 'SCHEDULE':
      return 'Schedule'
    case 'ESTIMATE':
      return 'Estimate'
    case 'FINANCE_SCENARIO':
      return 'Finance scenario'
    case 'QUOTE_VERSION':
      return 'Quote version'
    case 'CUSTOM_COST':
      return 'Custom cost'
    case 'VENDOR_COST':
      return 'Vendor cost'
    case 'FUNCTION':
      return 'Function'
    case 'OTHER':
      return 'Other'
    case 'STAFFING': // legacy UI alias
      return 'Staffing'
    default:
      return humanizeEnumToken(targetType)
  }
}

export function affectedAreaLabel(area: string): string {
  switch (area.trim().toUpperCase()) {
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
      return humanizeEnumToken(area)
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
  const labels: Record<string, string> = {
    SCOPE_CHANGE: 'Scope change',
    SCHEDULE_CHANGE: 'Schedule change',
    COST_CHANGE: 'Cost change',
    REVENUE_CHANGE: 'Revenue change',
    QUOTE_CHANGE: 'Quote change',
    RESOURCE_CHANGE: 'Resource change',
    RISK_RESPONSE: 'Risk response',
    OTHER: 'Other',
    // legacy WAVE3 / old FE values still may appear in old records
    SCOPE_ADDITION: 'Scope addition',
    SCOPE_REDUCTION: 'Scope reduction',
    RISK_ADJUSTMENT: 'Risk adjustment',
  }
  return labels[type.trim().toUpperCase()] ?? humanizeEnumToken(type)
}

export function changeOrderStatusLabel(status: string): string {
  switch (status.trim().toUpperCase()) {
    case ChangeOrderStatus.Pending:
      return 'Pending'
    case ChangeOrderStatus.Approved:
      return 'Approved'
    case ChangeOrderStatus.Rejected:
      return 'Rejected'
    case ChangeOrderStatus.Archived:
      return 'Archived'
    default:
      return humanizeEnumToken(status)
  }
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
