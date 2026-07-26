import type {
  HeatmapMetric,
  MyInsightsAttentionKind,
  MyInsightsDateRange,
  MyInsightsHealthStatus,
  MyInsightsWorkloadState,
} from '../enums/my-insights.enum'

export interface MyInsightsParams {
  range?: MyInsightsDateRange | string
  dateFrom?: string
  dateTo?: string
  projectId?: string
  phaseId?: string
  status?: string
  heatmapMetric?: HeatmapMetric | string
}

export interface MyInsightsSummary {
  remaining: number
  overdue: number
  blocked: number
  completed: number
  dueSoon?: number
  unscheduled?: number
}

export interface MyInsightsAttentionGroup {
  kind: MyInsightsAttentionKind | string
  label: string
  count: number
}

export interface MyInsightsWorkloadDay {
  date: string
  weekdayLabel: string
  plannedHours: number
  capacityHours: number | null
  state: MyInsightsWorkloadState | string
}

export interface MyInsightsHeatmapDay {
  date: string
  level: 0 | 1 | 2 | 3 | 4
  completedTasks: number
  completedEffortHours: number
  overdueResolved: number
  projectCount: number
}

export interface MyInsightsTrendPoint {
  weekLabel: string
  weekStart: string
  plannedHours: number
  completedHours: number
  plannedTasks?: number
  completedTasks?: number
  carryOverHours?: number
}

export interface MyInsightsDistributionSlice {
  key: string
  label: string
  hours: number
  percent: number
}

export interface MyInsightsTaskRow {
  taskId: string
  projectId: string
  projectName: string
  phaseName: string | null
  title: string
  dueDate: string | null
  /** Planned start — used for “due this week” window matching (My Work contract). */
  plannedStartDate: string | null
  estimateHours: number | null
  status: string
  chips: Array<'overdue' | 'blocked' | 'unscheduled' | 'today' | 'upcoming'>
}

export interface MyInsightsHealthMetric {
  key: string
  label: string
  valuePercent: number | null
  trendPercent: number | null
}

export interface MyInsightsHealth {
  status: MyInsightsHealthStatus | string
  statusLabel: string
  metrics: MyInsightsHealthMetric[]
}

export interface MyInsightsCarryOver {
  thisPeriodTasks: number
  previousPeriodTasks: number
  trendPercent: number | null
  trendLabel: string | null
  reasons: Array<{ label: string; count: number }>
  weekly: Array<{ weekLabel: string; count: number }>
}

export interface MyInsightsConsistency {
  activeDays: number
  workingDays: number
  currentStreak: number
  longestStreak: number
  noOverdueDays: number
}

export interface MyInsightsAiReview {
  available: boolean
  summary: string | null
  needsAttention: string[]
  suggestedAdjustment: string | null
  affectedTaskIds: string[]
}

export interface MyInsightsProjectOption {
  id: string
  name: string
}

export interface MyInsightsResponse {
  workspaceId: string
  userId: string
  range: string
  dateFrom: string
  dateTo: string
  projects: MyInsightsProjectOption[]
  summary: MyInsightsSummary
  attention: MyInsightsAttentionGroup[]
  workload: {
    capacityConfigured: boolean
    days: MyInsightsWorkloadDay[]
  }
  heatmap: {
    metric: string
    days: MyInsightsHeatmapDay[]
  }
  plannedVsCompleted: MyInsightsTrendPoint[]
  distribution: MyInsightsDistributionSlice[]
  currentWork: MyInsightsTaskRow[]
  health: MyInsightsHealth
  carryOver: MyInsightsCarryOver
  consistency: MyInsightsConsistency
  aiReview: MyInsightsAiReview
}
