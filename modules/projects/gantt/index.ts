export { ProjectGanttView } from './presentation/ui/ProjectGanttView'
export { CellTimelineView } from './presentation/ui/CellTimelineView'
export { ScheduleBucketSegment } from './presentation/ui/ScheduleBucketSegment'
export type { ScheduleFillKind } from './presentation/ui/ScheduleBucketSegment'
export { TimelineCollapseModeButton } from './presentation/ui/TimelineCollapseModeButton'
export { useProjectGantt } from './presentation/hooks/useProjectGantt'
export { useCellTimeline } from './presentation/hooks/useCellTimeline'
export * as ganttApi from './infrastructure/api/gantt.api'
export type {
  GanttItem,
  GanttTreeItem,
  GanttView,
  GanttViewParams,
  GanttSummary,
  RecalculateGanttPayload,
} from './domain/model/gantt'
export type { TimelineFlatRow, TimelineColumn } from './domain/model/timeline'
export {
  TIMELINE_LEFT_COLS,
  TIMELINE_ROW_HEIGHT,
  timelineRowHeight,
} from './domain/model/timeline-layout'
export {
  DEFAULT_DAY_CAPACITY_MINUTES,
  TimelineCollapseMode,
  TimelineGranularity,
  TimelineMetric,
} from './domain/enums/timeline.enum'
export type { TimelineCollapseMode as TimelineCollapseModeType } from './domain/enums/timeline.enum'
export type { TimelineGranularity as TimelineGranularityType } from './domain/enums/timeline.enum'
export type { TimelineMetric as TimelineMetricType } from './domain/enums/timeline.enum'
export {
  buildGanttTree,
  repairGanttWbsParents,
  computeGanttDateRange,
  ganttItemTypeLabel,
  resolveRecalculatePlanningWindow,
} from './domain/rules/gantt.rules'
export {
  collectProjectCollapseIds,
  flattenTimelineRows,
} from './domain/rules/timeline-rows.rules'
export type { TaskEnrichment } from './domain/rules/timeline-rows.rules'
export { formatEstimateHours } from './domain/rules/estimate-parse.rules'
export { formatTimelineCompactRange } from './domain/rules/phase-display.rules'
export { formatTimelineMetricLabel } from './domain/rules/timeline-metric-label.rules'
export {
  buildBucketsForRow,
  buildTimelineColumns,
  cellWidthPx,
} from './domain/rules/timeline-buckets.rules'
export { buildBucketSegment } from './domain/rules/bucket-segment.rules'
export { computeBarPixelRange } from './domain/rules/timeline-dependency-links.rules'
export {
  ensureTodayInViewport,
  ensureDateInViewport,
  resolveTimelineViewport,
} from './domain/rules/timeline-viewport.rules'
