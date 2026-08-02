import type { TimelineGranularity, TimelineMetric, TimelineMode } from '../enums/timeline.enum'

export interface TimelineDateRange {
  start: string
  end: string
}

export interface TimelineColumn {
  key: string
  label: string
  subLabel?: string
  periodStart: string
  periodEnd: string
  isWeekend: boolean
  isToday: boolean
}

export interface TimelineBucketCell {
  periodStart: string
  periodEnd: string
  plannedMinutes: number
  plannedContributionPercent: number | null
  cumulativePlannedPercent: number | null
  actualProgressPercent: number | null
  variancePercent: number | null
  occupancyPercent: number | null
  actualIsCarryForward: boolean
  scheduled: boolean
}

export interface TimelineRowSchedule {
  startDate: string | null
  endDate: string | null
}

export interface TimelineDraftPatch {
  itemId: string
  sourceTaskId: string
  startDate: string
  endDate: string
}

export interface TimelinePhaseSummary {
  taskCount: number
  completedCount: number
  activeCount: number
  blockedCount: number
  unscheduledCount: number
  atRiskCount: number
  progressPercent: number | null
}

export interface TimelineFlatRow {
  id: string
  kind: 'phase' | 'task' | 'milestone' | 'add'
  depth: number
  title: string
  /** Scannable phase name (prefix stripped). Tasks reuse title. */
  displayPrimary: string
  /** Phase code · status line; null for tasks. */
  displaySecondary: string | null
  phaseCode: string | null
  itemType: string
  sourceEntityId: string | null
  phaseId: string | null
  parentPhaseSourceId: string | null
  scheduleStatus: string
  assigneeUserId: string | null
  estimateHours: number | null
  status: string | null
  progressPercent: number | null
  atRisk: boolean
  startDate: string | null
  endDate: string | null
  collapsed?: boolean
  phaseSummary?: TimelinePhaseSummary | null
  phaseDescription?: string | null
}

export type { TimelineGranularity, TimelineMetric, TimelineMode }
