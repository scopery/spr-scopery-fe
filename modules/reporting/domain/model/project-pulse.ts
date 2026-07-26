import type {
  AttentionSeverity,
  FinancePermissionState,
  ProjectHealthStatus,
} from '../enums/project-health.enum'

export interface ProjectPulseBrief {
  projectName: string
  projectCode?: string
  health: ProjectHealthStatus
  healthLabel: string
  narrative: string
  drivers: string[]
  positiveSignals: string[]
  topMetrics: Array<{ key: string; label: string; value: string }>
  updatedAt?: string
}

export interface AttentionItem {
  id: string
  severity: AttentionSeverity
  title: string
  impact: string
  actionLabel: string
  href: string | null
}

export interface ProgressForecastInsight {
  available: boolean
  plannedPercent: number | null
  completedPercent: number | null
  variancePercent: number | null
  baselineFinish: string | null
  forecastFinish: string | null
  scheduleVarianceDays: number | null
  summary: string
}

export interface ScheduleMilestoneInsight {
  available: boolean
  forecastFinish: string | null
  baselineFinish: string | null
  scheduleVarianceDays: number | null
  criticalPathTasks: number | null
  dependencyConflicts: number | null
  overdueMilestones: number | null
  nextMilestone: string | null
  rows: Array<{ label: string; detail: string }>
}

export interface CapacityInsight {
  available: boolean
  overloadedTeams: number | null
  peakUtilizationPercent: number | null
  rows: Array<{ label: string; detail: string }>
  summary: string
}

export interface ScopeChangeInsight {
  available: boolean
  changeRequestCount: number | null
  functionsAffected: number | null
  estimatedReworkHours: number | null
  scheduleImpactDays: number | null
  scopeVariance: string | null
  rows: Array<{ label: string; value: string }>
}

export interface QualityCoverageInsight {
  available: boolean
  coveragePercent: number | null
  missingTests: number | null
  failedResults: number | null
  openDefects: number | null
  summary: string
}

export interface FinancialOutlookInsight {
  permission: FinancePermissionState
  available: boolean
  budget: string | null
  forecast: string | null
  variance: string | null
  margin: string | null
  reason: string | null
  rows: Array<{ label: string; value: string }>
}

export interface RiskIssueInsight {
  available: boolean
  overdueTasks: number | null
  blockedTasks: number | null
  atRiskTasks: number | null
  highRisks: number | null
  openIssues: number | null
  topItems: Array<{ label: string; detail: string }>
  summary: string
}

export interface ActivityTimelineItem {
  id: string
  summary: string
  detail?: string
  createdAt?: string
  dayKey: string
  dayLabel: string
  href: string | null
}

export interface ProjectSetupStep {
  id: string
  label: string
  description: string
  actionLabel: string
  done: boolean
  href: string | null
}

export interface ProjectSetupChecklist {
  show: boolean
  title: string
  description: string
  steps: ProjectSetupStep[]
  availableNow: Array<{ label: string; value: string; href: string | null }>
  waitingFor: string[]
  unlockNext: string[]
}

export interface ProjectPulseViewModel {
  brief: ProjectPulseBrief
  attention: AttentionItem[]
  progress: ProgressForecastInsight
  schedule: ScheduleMilestoneInsight
  capacity: CapacityInsight
  scopeChange: ScopeChangeInsight
  quality: QualityCoverageInsight
  financials: FinancialOutlookInsight
  risks: RiskIssueInsight
  activity: ActivityTimelineItem[]
  setup: ProjectSetupChecklist
  links: {
    schedule: string
    resources: string
    changeRequests: string
    traceability: string
    financials: string
    raid: string
    overview: string
    recommendations: string
  }
  /** P1 */
  changeSince: ChangeSinceInsight
  capacityHeatmap: CapacityHeatmapInsight
  burnup: BurnupInsight
  baselineOverlay: BaselineOverlayInsight
  aiReview: AiProjectReviewInsight
}

export type PulsePeriodFilter = 'last_visit' | 'yesterday' | 'last_7_days' | 'since_baseline'

export interface PulseFilterOption {
  value: string
  label: string
}

export interface ChangeSinceItem {
  id: string
  text: string
  href: string | null
}

export interface ChangeSinceInsight {
  available: boolean
  periodLabel: string
  items: ChangeSinceItem[]
}

export interface CapacityHeatmapCell {
  week: string
  utilizationPercent: number | null
}

export interface CapacityHeatmapRow {
  label: string
  cells: CapacityHeatmapCell[]
}

export interface CapacityHeatmapInsight {
  available: boolean
  weeks: string[]
  rows: CapacityHeatmapRow[]
  summary: string
}

export interface BurnupPoint {
  label: string
  plannedPercent: number | null
  completedPercent: number | null
}

export interface BurnupInsight {
  available: boolean
  points: BurnupPoint[]
  summary: string
}

export interface BaselineOverlayBar {
  id: string
  label: string
  baselineLabel: string
  currentLabel: string
  deltaLabel: string | null
  tone: 'neutral' | 'delayed' | 'improved' | 'new' | 'removed'
  baselineWidthPercent: number
  currentWidthPercent: number
  baselineOffsetPercent: number
  currentOffsetPercent: number
}

export interface BaselineOverlayInsight {
  available: boolean
  baselineName: string | null
  bars: BaselineOverlayBar[]
  summary: string
}

export interface AiReviewAction {
  id: string
  title: string
  detail: string
  href: string | null
  suggestionRef: string | null
  defaultSelected: boolean
}

export interface AiProjectReviewInsight {
  available: boolean
  overall: string
  why: string[]
  actions: AiReviewAction[]
}
