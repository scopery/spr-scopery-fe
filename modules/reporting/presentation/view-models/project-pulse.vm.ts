import {
  AttentionSeverity,
  FinancePermissionState,
  ProjectHealthStatus,
} from '../../domain/enums/project-health.enum'
import type { ProjectDashboardSummary } from '../../domain/model/report'
import type {
  ActivityTimelineItem,
  AttentionItem,
  CapacityInsight,
  FinancialOutlookInsight,
  ProgressForecastInsight,
  ProjectPulseBrief,
  ProjectPulseViewModel,
  QualityCoverageInsight,
  RiskIssueInsight,
  ScheduleMilestoneInsight,
  ScopeChangeInsight,
} from '../../domain/model/project-pulse'
import {
  buildProjectSetupChecklist,
  normalizeProjectHealthStatus,
  projectHealthLabel,
} from '../../domain/rules/project-pulse.rules'
import {
  asRecord,
  firstNum,
  firstStr,
  formatPercent,
  formatSignedDays,
  hasMeaningfulPayload,
  str,
} from './insight-field'
import {
  adaptAiProjectReview,
  adaptBaselineOverlay,
  adaptBurnup,
  adaptCapacityHeatmap,
  adaptChangeSince,
  filterActivityByPeriod,
} from './project-pulse-p1.vm'

export interface ProjectPulseRouteMap {
  overview: string
  wbs: string
  work: string
  schedule: string
  timeline: string
  estimation: string
  resources: string
  baselines: string
  changeRequests: string
  raid: string
  financials: string
  quality: string
  traceability: string
  functionalCatalog: string
  capacity: string
  recommendations: string
}

export interface ProjectPulseSourceInput {
  dashboard: ProjectDashboardSummary | null
  healthPayload: Record<string, unknown> | null
  kpisPayload: Record<string, unknown> | null
  attentionPayload: Record<string, unknown> | null
  reports: Record<string, Record<string, unknown>>
  activity: Array<{ id: string; summary: string; createdAt?: string }>
  routes: ProjectPulseRouteMap
  period: import('../../domain/model/project-pulse').PulsePeriodFilter
  lastVisit: import('./project-pulse-p1.vm').PulseVisitSnapshot | null
  baselineName: string | null
  baselineCreatedAt: string | null
  recommendations: Array<{
    id: string
    title: string
    summary?: string | null
    suggestionRef?: string
  }>
}

function dayParts(iso?: string): { dayKey: string; dayLabel: string } {
  if (!iso) return { dayKey: 'unknown', dayLabel: 'Earlier' }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return { dayKey: iso, dayLabel: iso }
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  if (sameDay(date, today)) return { dayKey: 'today', dayLabel: 'Today' }
  if (sameDay(date, yesterday)) return { dayKey: 'yesterday', dayLabel: 'Yesterday' }
  return {
    dayKey: date.toISOString().slice(0, 10),
    dayLabel: date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }
}

function mapAttentionFromApi(
  payload: Record<string, unknown> | null,
  routes: ProjectPulseRouteMap
): AttentionItem[] {
  if (!payload) return []
  const raw = payload.items ?? payload.attention ?? payload.attentionItems ?? payload.alerts
  if (!Array.isArray(raw)) return []
  return raw.map((row, index) => {
    const item = asRecord(row)
    const severityRaw = (firstStr(item, ['severity', 'level', 'priority']) ?? 'MEDIUM').toUpperCase()
    const severity =
      severityRaw === 'HIGH' || severityRaw === 'CRITICAL'
        ? AttentionSeverity.High
        : severityRaw === 'LOW' || severityRaw === 'INFO'
          ? AttentionSeverity.Low
          : AttentionSeverity.Medium
    return {
      id: firstStr(item, ['id']) ?? `attention-api-${index}`,
      severity,
      title: firstStr(item, ['title', 'label', 'message', 'summary']) ?? 'Needs attention',
      impact: firstStr(item, ['impact', 'detail', 'description', 'reason']) ?? 'Review this item.',
      actionLabel: firstStr(item, ['actionLabel', 'cta']) ?? 'Review',
      href: firstStr(item, ['href', 'url']) ?? inferAttentionHref(item, routes),
    }
  })
}

function inferAttentionHref(
  item: Record<string, unknown>,
  routes: ProjectPulseRouteMap
): string | null {
  const type = (firstStr(item, ['type', 'category', 'entityType']) ?? '').toUpperCase()
  if (type.includes('CAPACITY') || type.includes('WORKLOAD')) return routes.resources
  if (type.includes('CHANGE') || type.includes('CR')) return routes.changeRequests
  if (type.includes('RISK') || type.includes('ISSUE') || type.includes('RAID')) return routes.raid
  if (type.includes('TEST') || type.includes('QUALITY') || type.includes('COVERAGE')) {
    return routes.traceability
  }
  if (type.includes('SCHEDULE') || type.includes('MILESTONE')) return routes.schedule
  if (type.includes('TASK')) return routes.work
  return routes.work
}

function synthesizeAttention(
  dashboard: ProjectDashboardSummary | null,
  reports: Record<string, Record<string, unknown>>,
  routes: ProjectPulseRouteMap
): AttentionItem[] {
  const items: AttentionItem[] = []
  const risk = dashboard?.taskRisk
  const capacity = asRecord(reports.capacity)
  const changeImpact = asRecord(reports['change-impact'])

  if ((risk?.overdueTasks ?? 0) > 0) {
    items.push({
      id: 'overdue-tasks',
      severity: AttentionSeverity.High,
      title: `${risk?.overdueTasks} overdue tasks`,
      impact: 'Overdue work can push forecast finish and block dependent tasks.',
      actionLabel: 'Review tasks',
      href: routes.work,
    })
  }
  if ((risk?.blockedTasks ?? 0) > 0) {
    items.push({
      id: 'blocked-tasks',
      severity: AttentionSeverity.Medium,
      title: `${risk?.blockedTasks} blocked tasks`,
      impact: 'Blocked work needs owner follow-up before schedule recovery.',
      actionLabel: 'Review blocked work',
      href: routes.work,
    })
  }
  if ((risk?.atRiskTasks ?? 0) > 0) {
    items.push({
      id: 'at-risk-tasks',
      severity: AttentionSeverity.Medium,
      title: `${risk?.atRiskTasks} tasks at risk`,
      impact: 'At-risk tasks may move project finish if not mitigated.',
      actionLabel: 'Review at-risk tasks',
      href: routes.work,
    })
  }

  const peak = firstNum(capacity, [
    'peakUtilizationPercent',
    'maxUtilizationPercent',
    'utilizationPercent',
  ])
  if (peak != null && peak > 100) {
    items.push({
      id: 'capacity-overload',
      severity: AttentionSeverity.High,
      title: `Capacity is ${Math.round(peak)}%`,
      impact: 'Overloaded teams may delay testing or delivery milestones.',
      actionLabel: 'Review workload',
      href: routes.resources,
    })
  }

  const crCount =
    firstNum(changeImpact, ['openChangeRequests', 'changeRequestCount', 'count']) ??
    dashboard?.changeRequests?.count ??
    null
  const scheduleImpact = firstNum(changeImpact, [
    'scheduleImpactDays',
    'forecastScheduleImpactDays',
    'daysImpact',
  ])
  if (crCount != null && crCount > 0) {
    items.push({
      id: 'open-crs',
      severity: scheduleImpact && scheduleImpact > 0 ? AttentionSeverity.High : AttentionSeverity.Medium,
      title: `${crCount} open change request${crCount === 1 ? '' : 's'}`,
      impact:
        scheduleImpact != null && scheduleImpact > 0
          ? `Estimated schedule impact ${formatSignedDays(scheduleImpact)}.`
          : 'Pending changes may affect scope, effort, and forecast.',
      actionLabel: 'Review change requests',
      href: routes.changeRequests,
    })
  }

  if ((risk?.tasksWithoutEstimate ?? 0) > 0) {
    items.push({
      id: 'missing-estimates',
      severity: AttentionSeverity.Low,
      title: `${risk?.tasksWithoutEstimate} tasks have no estimate`,
      impact: 'Missing estimates weaken forecast and capacity planning.',
      actionLabel: 'Open estimation',
      href: routes.estimation,
    })
  }

  return items
}

function buildBrief(
  dashboard: ProjectDashboardSummary | null,
  healthPayload: Record<string, unknown> | null,
  kpisPayload: Record<string, unknown> | null,
  attention: AttentionItem[],
  progress: ProgressForecastInsight
): ProjectPulseBrief {
  const healthRaw =
    firstStr(asRecord(healthPayload), ['status', 'healthStatus', 'health']) ??
    dashboard?.health?.status
  const health = normalizeProjectHealthStatus(healthRaw)
  const driversFromApi = asRecord(healthPayload).drivers ?? asRecord(healthPayload).mainDrivers
  const drivers: string[] = Array.isArray(driversFromApi)
    ? driversFromApi.map((d) => str(d) ?? '').filter(Boolean)
    : []

  if (drivers.length === 0) {
    if (progress.scheduleVarianceDays != null && progress.scheduleVarianceDays > 0) {
      drivers.push(
        `Forecast finish is ${formatSignedDays(progress.scheduleVarianceDays)} later than baseline`
      )
    }
    attention.slice(0, 3).forEach((item) => drivers.push(item.title))
  }

  const positive: string[] = []
  if (progress.variancePercent != null && progress.variancePercent > 0) {
    positive.push(`Completed scope is ${Math.round(progress.variancePercent)}% ahead of plan`)
  }
  if ((dashboard?.taskRisk?.completedTasks ?? 0) > 0) {
    positive.push(`${dashboard?.taskRisk?.completedTasks} tasks completed`)
  }

  const narrativeFromApi = firstStr(asRecord(healthPayload), [
    'narrative',
    'summary',
    'message',
    'description',
  ])
  let narrative = narrativeFromApi
  if (!narrative) {
    if (health === ProjectHealthStatus.InsufficientData) {
      narrative =
        'Project health is unavailable until schedule, baseline, and capacity signals are in place.'
    } else if (attention.length > 0) {
      narrative = `${attention[0].title}. ${attention[0].impact}`
    } else if (health === ProjectHealthStatus.OnTrack) {
      narrative = 'Delivery signals look stable. Keep watching capacity and change pressure.'
    } else {
      narrative = 'Review attention items and forecast variance before the next planning checkpoint.'
    }
  }

  const topMetrics: ProjectPulseBrief['topMetrics'] = []
  const kpiRow = asRecord(kpisPayload)
  const kpiItems = kpiRow.items ?? kpiRow.kpis
  if (Array.isArray(kpiItems)) {
    kpiItems.slice(0, 6).forEach((row, index) => {
      const item = asRecord(row)
      topMetrics.push({
        key: firstStr(item, ['key', 'id']) ?? `kpi-${index}`,
        label: firstStr(item, ['label', 'name']) ?? 'Metric',
        value: firstStr(item, ['value', 'displayValue']) ?? '—',
      })
    })
  }
  if (topMetrics.length === 0) {
    const risk = dashboard?.taskRisk
    const completed = risk?.completedTasks
    const total = risk?.totalTasks
    if (completed != null && total != null && total > 0) {
      topMetrics.push({
        key: 'complete',
        label: 'Complete',
        value: formatPercent((completed / total) * 100) ?? '—',
      })
    }
    if (progress.forecastFinish) {
      topMetrics.push({
        key: 'forecast',
        label: 'Forecast finish',
        value: progress.forecastFinish,
      })
    }
    if (risk?.overdueTasks != null) {
      topMetrics.push({ key: 'overdue', label: 'Overdue', value: String(risk.overdueTasks) })
    }
    if (dashboard?.changeRequests?.count != null) {
      topMetrics.push({
        key: 'crs',
        label: 'Open CRs',
        value: String(dashboard.changeRequests.count),
      })
    }
    if (risk?.atRiskTasks != null) {
      topMetrics.push({ key: 'atRisk', label: 'At risk tasks', value: String(risk.atRiskTasks) })
    }
  }

  return {
    projectName: dashboard?.project?.name ?? 'Project Pulse',
    projectCode: dashboard?.project?.code,
    health,
    healthLabel: projectHealthLabel(health),
    narrative,
    drivers: drivers.slice(0, 4),
    positiveSignals: positive.slice(0, 3),
    topMetrics: topMetrics.slice(0, 6),
    updatedAt: firstStr(asRecord(healthPayload), ['updatedAt', 'generatedAt']) ?? undefined,
  }
}

function adaptProgress(
  dashboard: ProjectDashboardSummary | null,
  reports: Record<string, Record<string, unknown>>
): ProgressForecastInsight {
  const baseline = asRecord(reports['baseline-vs-current'])
  const schedule = asRecord(reports['schedule-risk'])
  const risk = dashboard?.taskRisk
  const completed = risk?.completedTasks ?? null
  const total = risk?.totalTasks ?? null
  const completedPercent =
    completed != null && total != null && total > 0 ? (completed / total) * 100 : null
  const plannedPercent = firstNum(baseline, [
    'plannedPercentByToday',
    'plannedCompletionPercent',
    'plannedPercent',
  ])
  const variancePercent =
    completedPercent != null && plannedPercent != null
      ? completedPercent - plannedPercent
      : firstNum(baseline, ['completionVariancePercent', 'scopeVariancePercent'])
  const baselineFinish = firstStr(baseline, [
    'baselineFinish',
    'baselineEndDate',
    'baselineFinishDate',
  ])
  const forecastFinish = firstStr(schedule, [
    'forecastFinish',
    'forecastEndDate',
    'currentFinish',
  ]) ?? firstStr(baseline, ['currentFinish', 'forecastFinish', 'currentEndDate'])
  const scheduleVarianceDays = firstNum(schedule, [
    'scheduleVarianceDays',
    'varianceDays',
    'delayDays',
  ]) ?? firstNum(baseline, ['scheduleVarianceDays', 'varianceDays'])

  const available =
    completedPercent != null ||
    plannedPercent != null ||
    baselineFinish != null ||
    forecastFinish != null ||
    scheduleVarianceDays != null

  let summary = 'Progress vs plan is not available yet.'
  if (available) {
    const bits = [
      completedPercent != null ? `${Math.round(completedPercent)}% complete` : null,
      plannedPercent != null ? `${Math.round(plannedPercent)}% planned by today` : null,
      variancePercent != null
        ? `${variancePercent >= 0 ? '+' : ''}${Math.round(variancePercent)}% vs plan`
        : null,
      formatSignedDays(scheduleVarianceDays),
    ].filter(Boolean)
    summary = bits.join(' · ')
  }

  return {
    available,
    plannedPercent,
    completedPercent,
    variancePercent,
    baselineFinish,
    forecastFinish,
    scheduleVarianceDays,
    summary,
  }
}

function adaptSchedule(
  reports: Record<string, Record<string, unknown>>,
  progress: ProgressForecastInsight
): ScheduleMilestoneInsight {
  const schedule = asRecord(reports['schedule-risk'])
  const available = hasMeaningfulPayload(schedule) || progress.available
  const criticalPathTasks = firstNum(schedule, ['criticalPathTasks', 'criticalPathCount'])
  const dependencyConflicts = firstNum(schedule, [
    'dependencyConflicts',
    'conflictCount',
    'conflicts',
  ])
  const overdueMilestones = firstNum(schedule, ['overdueMilestones', 'milestonesOverdue'])
  const nextMilestone = firstStr(schedule, ['nextMilestone', 'nextMilestoneName'])
  const rows: ScheduleMilestoneInsight['rows'] = []
  if (criticalPathTasks != null) {
    rows.push({ label: 'Critical path', detail: `${criticalPathTasks} tasks` })
  }
  if (dependencyConflicts != null) {
    rows.push({ label: 'Dependency conflicts', detail: String(dependencyConflicts) })
  }
  if (overdueMilestones != null) {
    rows.push({ label: 'Overdue milestones', detail: String(overdueMilestones) })
  }
  if (nextMilestone) {
    rows.push({ label: 'Next milestone', detail: nextMilestone })
  }
  return {
    available,
    forecastFinish: progress.forecastFinish,
    baselineFinish: progress.baselineFinish,
    scheduleVarianceDays: progress.scheduleVarianceDays,
    criticalPathTasks,
    dependencyConflicts,
    overdueMilestones,
    nextMilestone,
    rows,
  }
}

function adaptCapacity(reports: Record<string, Record<string, unknown>>): CapacityInsight {
  const capacity = asRecord(reports.capacity)
  const available = hasMeaningfulPayload(capacity)
  const peakUtilizationPercent = firstNum(capacity, [
    'peakUtilizationPercent',
    'maxUtilizationPercent',
    'utilizationPercent',
  ])
  const overloadedTeams = firstNum(capacity, [
    'overloadedTeams',
    'overAllocatedCount',
    'overAllocatedResourceCount',
  ])
  const rows: CapacityInsight['rows'] = []
  const teams = capacity.teams ?? capacity.byTeam ?? capacity.resources
  if (Array.isArray(teams)) {
    teams.slice(0, 4).forEach((row) => {
      const item = asRecord(row)
      const label = firstStr(item, ['name', 'team', 'role', 'label']) ?? 'Team'
      const util = firstNum(item, ['utilizationPercent', 'allocationPercent', 'percent'])
      rows.push({
        label,
        detail: util != null ? `${Math.round(util)}%` : firstStr(item, ['status', 'detail']) ?? '—',
      })
    })
  }
  if (rows.length === 0 && peakUtilizationPercent != null) {
    rows.push({ label: 'Peak utilization', detail: `${Math.round(peakUtilizationPercent)}%` })
  }
  if (rows.length === 0 && overloadedTeams != null) {
    rows.push({ label: 'Overloaded teams', detail: String(overloadedTeams) })
  }

  let summary = 'Capacity insights unlock after team capacity is configured.'
  if (available) {
    summary = [
      peakUtilizationPercent != null ? `Peak ${Math.round(peakUtilizationPercent)}%` : null,
      overloadedTeams != null ? `${overloadedTeams} overloaded` : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Capacity data available.'
  }

  return {
    available,
    overloadedTeams,
    peakUtilizationPercent,
    rows,
    summary,
  }
}

function adaptScopeChange(
  dashboard: ProjectDashboardSummary | null,
  reports: Record<string, Record<string, unknown>>
): ScopeChangeInsight {
  const change = asRecord(reports['change-impact'])
  const baseline = asRecord(reports['baseline-vs-current'])
  const changeRequestCount =
    firstNum(change, ['openChangeRequests', 'changeRequestCount', 'count']) ??
    dashboard?.changeRequests?.count ??
    null
  const functionsAffected = firstNum(change, [
    'functionsAffected',
    'affectedFunctions',
    'functionCount',
  ])
  const estimatedReworkHours = firstNum(change, [
    'estimatedReworkHours',
    'proposedReworkHours',
    'reworkHours',
  ])
  const scheduleImpactDays = firstNum(change, [
    'scheduleImpactDays',
    'forecastScheduleImpactDays',
    'daysImpact',
  ])
  const scopeVarianceCount = firstNum(baseline, ['scopeVarianceCount', 'functionVariance'])
  const scopeVariance =
    firstStr(baseline, ['scopeVarianceLabel', 'scopeVariance']) ??
    (scopeVarianceCount != null ? `${scopeVarianceCount} functions` : null)

  const available =
    changeRequestCount != null ||
    functionsAffected != null ||
    estimatedReworkHours != null ||
    hasMeaningfulPayload(change) ||
    hasMeaningfulPayload(baseline)

  const rows: ScopeChangeInsight['rows'] = []
  if (changeRequestCount != null) {
    rows.push({ label: 'Open change requests', value: String(changeRequestCount) })
  }
  if (functionsAffected != null) {
    rows.push({ label: 'Functions affected', value: String(functionsAffected) })
  }
  if (estimatedReworkHours != null) {
    rows.push({ label: 'Proposed rework', value: `${estimatedReworkHours}h` })
  }
  if (scheduleImpactDays != null) {
    rows.push({
      label: 'Schedule impact',
      value: formatSignedDays(scheduleImpactDays) ?? String(scheduleImpactDays),
    })
  }
  if (scopeVariance) rows.push({ label: 'Scope variance', value: scopeVariance })

  return {
    available,
    changeRequestCount,
    functionsAffected,
    estimatedReworkHours,
    scheduleImpactDays,
    scopeVariance,
    rows,
  }
}

function adaptQuality(reports: Record<string, Record<string, unknown>>): QualityCoverageInsight {
  const quality = asRecord(reports.quality ?? reports['test-coverage'] ?? reports.notifications)
  // Notifications is a weak fallback — only treat as quality when coverage-like keys exist.
  const coveragePercent = firstNum(quality, [
    'coveragePercent',
    'requirementCoveragePercent',
    'testCoveragePercent',
  ])
  const missingTests = firstNum(quality, ['missingTests', 'requirementsWithoutTests'])
  const failedResults = firstNum(quality, ['failedResults', 'failedTestResults'])
  const openDefects = firstNum(quality, ['openDefects', 'defectCount'])
  const available =
    coveragePercent != null ||
    missingTests != null ||
    failedResults != null ||
    openDefects != null

  const summary = available
    ? [
        coveragePercent != null ? `${Math.round(coveragePercent)}% covered` : null,
        missingTests != null ? `${missingTests} missing tests` : null,
        openDefects != null ? `${openDefects} open defects` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Quality coverage will appear when test/traceability data is linked.'

  return {
    available,
    coveragePercent,
    missingTests,
    failedResults,
    openDefects,
    summary,
  }
}

function adaptFinancials(
  dashboard: ProjectDashboardSummary | null,
  reports: Record<string, Record<string, unknown>>
): FinancialOutlookInsight {
  const financeMeta = dashboard?.finance
  const finance = asRecord(reports.finance)
  if (financeMeta?.detailsRedacted || financeMeta?.available === false) {
    return {
      permission: FinancePermissionState.Masked,
      available: false,
      budget: null,
      forecast: null,
      variance: null,
      margin: null,
      reason:
        financeMeta.reason ??
        "You don’t have permission to view project financials.",
      rows: [],
    }
  }

  if (!hasMeaningfulPayload(finance) && financeMeta?.available !== true) {
    return {
      permission: FinancePermissionState.Unavailable,
      available: false,
      budget: null,
      forecast: null,
      variance: null,
      margin: null,
      reason: 'Financial forecast unlocks after a finance scenario is available.',
      rows: [],
    }
  }

  const budget = firstStr(finance, ['budget', 'approvedBudget', 'budgetDisplay'])
  const forecast = firstStr(finance, [
    'forecast',
    'forecastAtComplete',
    'forecastCost',
    'forecastDisplay',
  ])
  const variance = firstStr(finance, ['variance', 'costVariance', 'varianceDisplay'])
  const margin = firstStr(finance, ['margin', 'forecastMargin', 'marginDisplay'])
  const rows: FinancialOutlookInsight['rows'] = []
  if (budget) rows.push({ label: 'Approved budget', value: budget })
  if (forecast) rows.push({ label: 'Forecast at complete', value: forecast })
  if (variance) rows.push({ label: 'Variance', value: variance })
  if (margin) rows.push({ label: 'Margin', value: margin })

  // Numeric fallbacks when BE returns numbers instead of display strings.
  if (rows.length === 0) {
    const budgetN = firstNum(finance, ['approvedBudget', 'budgetAmount', 'budget'])
    const forecastN = firstNum(finance, ['forecastAtComplete', 'forecastCost', 'forecast'])
    const varianceN = firstNum(finance, ['costVariance', 'variance'])
    const marginN = firstNum(finance, ['forecastMarginPercent', 'marginPercent'])
    if (budgetN != null) rows.push({ label: 'Approved budget', value: String(budgetN) })
    if (forecastN != null) rows.push({ label: 'Forecast at complete', value: String(forecastN) })
    if (varianceN != null) rows.push({ label: 'Variance', value: String(varianceN) })
    if (marginN != null) rows.push({ label: 'Margin', value: `${marginN}%` })
  }

  return {
    permission: FinancePermissionState.Allowed,
    available: rows.length > 0,
    budget: budget ?? rows.find((r) => r.label.includes('budget'))?.value ?? null,
    forecast: forecast ?? rows.find((r) => r.label.includes('Forecast'))?.value ?? null,
    variance: variance ?? rows.find((r) => r.label.includes('Variance'))?.value ?? null,
    margin: margin ?? rows.find((r) => r.label.includes('Margin'))?.value ?? null,
    reason: null,
    rows,
  }
}

function adaptRisks(
  dashboard: ProjectDashboardSummary | null,
  reports: Record<string, Record<string, unknown>>
): RiskIssueInsight {
  const taskRiskReport = asRecord(reports['task-risk'])
  const risk = dashboard?.taskRisk
  const overdueTasks = risk?.overdueTasks ?? firstNum(taskRiskReport, ['overdueTasks'])
  const blockedTasks = risk?.blockedTasks ?? firstNum(taskRiskReport, ['blockedTasks'])
  const atRiskTasks = risk?.atRiskTasks ?? firstNum(taskRiskReport, ['atRiskTasks'])
  const highRisks = firstNum(taskRiskReport, ['highRisks', 'highRiskCount'])
  const openIssues = firstNum(taskRiskReport, ['openIssues', 'issueCount'])
  const available =
    overdueTasks != null ||
    blockedTasks != null ||
    atRiskTasks != null ||
    highRisks != null ||
    openIssues != null

  const topItems: RiskIssueInsight['topItems'] = []
  if (overdueTasks) topItems.push({ label: 'Overdue tasks', detail: String(overdueTasks) })
  if (blockedTasks) topItems.push({ label: 'Blocked tasks', detail: String(blockedTasks) })
  if (atRiskTasks) topItems.push({ label: 'At-risk tasks', detail: String(atRiskTasks) })
  if (highRisks) topItems.push({ label: 'High risks', detail: String(highRisks) })
  if (openIssues) topItems.push({ label: 'Open issues', detail: String(openIssues) })

  return {
    available,
    overdueTasks,
    blockedTasks,
    atRiskTasks,
    highRisks,
    openIssues,
    topItems,
    summary: available
      ? topItems.map((t) => `${t.label}: ${t.detail}`).join(' · ')
      : 'Risk and issue exposure will appear as RAID and task-risk signals arrive.',
  }
}

function adaptActivity(
  activity: Array<{ id: string; summary: string; createdAt?: string }>,
  routes: ProjectPulseRouteMap
): ActivityTimelineItem[] {
  return activity
    .filter((item) => {
      const summary = item.summary.trim()
      if (!summary) return false
      // Drop UUID-only noise when possible.
      if (/^[0-9a-f-]{36}$/i.test(summary)) return false
      return true
    })
    .map((item) => {
      const { dayKey, dayLabel } = dayParts(item.createdAt)
      const upper = item.summary.toUpperCase()
      let href: string | null = null
      if (upper.includes('CHANGE REQUEST') || /\bCR[- ]?\d+/i.test(item.summary)) {
        href = routes.changeRequests
      } else if (upper.includes('BASELINE')) {
        href = routes.baselines
      } else if (upper.includes('RISK') || upper.includes('RAID')) {
        href = routes.raid
      } else if (upper.includes('TASK')) {
        href = routes.work
      }
      return {
        id: item.id,
        summary: item.summary,
        createdAt: item.createdAt,
        dayKey,
        dayLabel,
        href,
      }
    })
}

export function mapProjectPulseViewModel(input: ProjectPulseSourceInput): ProjectPulseViewModel {
  const reports = input.reports
  const progress = adaptProgress(input.dashboard, reports)
  const schedule = adaptSchedule(reports, progress)
  const capacity = adaptCapacity(reports)
  const scopeChange = adaptScopeChange(input.dashboard, reports)
  const quality = adaptQuality(reports)
  const financials = adaptFinancials(input.dashboard, reports)
  const risks = adaptRisks(input.dashboard, reports)

  const apiAttention = mapAttentionFromApi(input.attentionPayload, input.routes)
  const attention =
    apiAttention.length > 0
      ? apiAttention
      : synthesizeAttention(input.dashboard, reports, input.routes)

  const brief = buildBrief(
    input.dashboard,
    input.healthPayload,
    input.kpisPayload,
    attention,
    progress
  )

  const activityItems = adaptActivity(input.activity, input.routes)

  const setup = buildProjectSetupChecklist({
    data: input.dashboard,
    hasScheduleData: schedule.available && hasMeaningfulPayload(asRecord(reports['schedule-risk'])),
    hasCapacityData: capacity.available,
    hasEstimationData: hasMeaningfulPayload(asRecord(reports.estimation)),
    activityCount: activityItems.length,
    routes: {
      overview: input.routes.overview,
      wbs: input.routes.wbs,
      work: input.routes.work,
      estimation: input.routes.estimation,
      resources: input.routes.resources,
      schedule: input.routes.schedule,
      baselines: input.routes.baselines,
      changeRequests: input.routes.changeRequests,
    },
  })

  if (setup.show) {
    brief.health = ProjectHealthStatus.InsufficientData
    brief.healthLabel = projectHealthLabel(ProjectHealthStatus.InsufficientData)
    brief.narrative = setup.description
    brief.topMetrics = brief.topMetrics.filter((m) => m.value !== '0' && m.key !== 'overdue' && m.key !== 'atRisk')
    brief.drivers = []
    brief.positiveSignals = []
  }

  const filteredActivity = filterActivityByPeriod(
    activityItems,
    input.period,
    input.lastVisit?.visitedAt ?? null,
    input.baselineCreatedAt
  )

  const changeSince = adaptChangeSince({
    period: input.period,
    lastVisit: input.lastVisit,
    dashboard: input.dashboard,
    capacity,
    progress,
    scopeChange,
    activity: activityItems,
    links: {
      work: input.routes.work,
      changeRequests: input.routes.changeRequests,
      resources: input.routes.resources,
      schedule: input.routes.schedule,
    },
    baselineCreatedAt: input.baselineCreatedAt,
  })

  const capacityHeatmap = adaptCapacityHeatmap(reports, capacity)
  const burnup = adaptBurnup(reports, progress)
  const baselineOverlay = adaptBaselineOverlay(reports, progress, input.baselineName)
  const aiReview = adaptAiProjectReview({
    narrative: brief.narrative,
    drivers: brief.drivers,
    attention,
    recommendations: input.recommendations,
    aiPlanning: input.dashboard?.aiPlanning,
    links: {
      recommendations: input.routes.recommendations,
      work: input.routes.work,
      resources: input.routes.resources,
      changeRequests: input.routes.changeRequests,
    },
  })

  return {
    brief,
    attention,
    progress,
    schedule,
    capacity,
    scopeChange,
    quality,
    financials,
    risks,
    activity: filteredActivity,
    setup,
    links: {
      schedule: input.routes.schedule,
      resources: input.routes.resources,
      changeRequests: input.routes.changeRequests,
      traceability: input.routes.traceability,
      financials: input.routes.financials,
      raid: input.routes.raid,
      overview: input.routes.overview,
      recommendations: input.routes.recommendations,
    },
    changeSince,
    capacityHeatmap,
    burnup,
    baselineOverlay,
    aiReview,
  }
}
