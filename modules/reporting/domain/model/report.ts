export interface ReportDefinition {
  id: string
  code: string
  name: string
  description?: string | null
}

export interface ReportRun {
  id: string
  reportCode: string
  status: string
  createdAt: string
  completedAt?: string | null
  downloadUrl?: string | null
}

export interface ReportExportJob {
  id: string
  reportRunId?: string
  reportCode?: string
  status: string
  format?: string
  fileName?: string | null
  createdAt?: string
  completedAt?: string | null
}

/** Matches BE `ProjectDashboardResponse`. */
export interface ProjectDashboardSummary {
  project?: {
    id: string
    code: string
    name: string
    status: string
  }
  taskRisk?: {
    totalTasks?: number
    todoTasks?: number
    inProgressTasks?: number
    blockedTasks?: number
    completedTasks?: number
    cancelledTasks?: number
    overdueTasks?: number
    dueSoonTasks?: number
    unscheduledTasks?: number
    atRiskTasks?: number
    tasksWithoutEstimate?: number
    tasksWithoutAssignee?: number
  }
  health?: {
    status?: string
    formulaVersion?: string
  }
  baseline?: {
    currentBaselineId?: string | null
    hasCurrentBaseline?: boolean
  }
  changeRequests?: {
    count?: number
  }
  aiPlanning?: Record<string, unknown>
  finance?: {
    available?: boolean
    detailsRedacted?: boolean
    reason?: string
    currentFinanceScenarioId?: string
  }
  quote?: {
    available?: boolean
    detailsRedacted?: boolean
    reason?: string
    currentQuoteVersionId?: string
  }
}

export interface DashboardMetric {
  key: string
  label: string
  value: string | number
}

export interface ActivityFeedItem {
  id: string
  summary: string
  createdAt?: string
}

/** Derive KPI cards from the typed dashboard payload (BE has no `metrics` array). */
export function mapDashboardToMetrics(data: ProjectDashboardSummary | null): DashboardMetric[] {
  if (!data) return []
  const risk = data.taskRisk
  const metrics: DashboardMetric[] = []
  if (data.health?.status != null) {
    metrics.push({ key: 'health', label: 'Health', value: data.health.status })
  }
  if (risk?.totalTasks != null) {
    metrics.push({ key: 'totalTasks', label: 'Tasks', value: risk.totalTasks })
  }
  if (risk?.overdueTasks != null) {
    metrics.push({ key: 'overdueTasks', label: 'Overdue', value: risk.overdueTasks })
  }
  if (risk?.blockedTasks != null) {
    metrics.push({ key: 'blockedTasks', label: 'Blocked', value: risk.blockedTasks })
  }
  if (risk?.atRiskTasks != null) {
    metrics.push({ key: 'atRiskTasks', label: 'At risk', value: risk.atRiskTasks })
  }
  if (data.changeRequests?.count != null) {
    metrics.push({
      key: 'changeRequests',
      label: 'Change requests',
      value: data.changeRequests.count,
    })
  }
  if (data.baseline?.hasCurrentBaseline != null) {
    metrics.push({
      key: 'baseline',
      label: 'Current baseline',
      value: data.baseline.hasCurrentBaseline ? 'Yes' : 'No',
    })
  }
  return metrics
}

export function mapActivityFeedItem(
  raw: Record<string, unknown>,
  index: number
): ActivityFeedItem {
  const timestamp = raw.timestamp != null ? String(raw.timestamp) : undefined
  const message = raw.message != null ? String(raw.message) : undefined
  const action = raw.action != null ? String(raw.action) : undefined
  const actorName = raw.actorName != null ? String(raw.actorName) : undefined
  const summary =
    message ||
    [actorName, action].filter(Boolean).join(' · ') ||
    `Activity ${index + 1}`
  return {
    id: `${timestamp ?? 'row'}-${index}`,
    summary,
    createdAt: timestamp,
  }
}
