import { TimelineMetric } from '../enums/timeline.enum'
import type { TimelineBucketCell } from '../model/timeline'

/**
 * Per-cell label for Display modes other than Schedule.
 * Schedule itself is bar-only (no numeric overlay).
 */
export function formatTimelineMetricLabel(
  metric: string,
  bucket: Pick<
    TimelineBucketCell,
    | 'scheduled'
    | 'plannedMinutes'
    | 'plannedContributionPercent'
    | 'actualProgressPercent'
    | 'variancePercent'
    | 'occupancyPercent'
    | 'actualIsCarryForward'
  > | null
    | undefined,
  options?: { include?: boolean }
): string {
  if (options?.include === false) return ''
  if (!bucket?.scheduled) return ''

  if (metric === TimelineMetric.Effort) {
    if (bucket.plannedMinutes <= 0) return ''
    const h = bucket.plannedMinutes / 60
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
  }
  if (metric === TimelineMetric.PlannedPercent) {
    return bucket.plannedContributionPercent != null
      ? String(Math.round(bucket.plannedContributionPercent))
      : ''
  }
  if (metric === TimelineMetric.ActualPercent) {
    if (bucket.actualProgressPercent == null) return ''
    const n = Math.round(bucket.actualProgressPercent)
    return bucket.actualIsCarryForward ? `~${n}` : String(n)
  }
  if (metric === TimelineMetric.Variance) {
    if (bucket.variancePercent == null) return ''
    const rounded = Math.round(bucket.variancePercent)
    return rounded > 0 ? `+${rounded}` : String(rounded)
  }
  if (metric === TimelineMetric.Occupancy) {
    if (bucket.occupancyPercent == null) return ''
    return `${Math.round(bucket.occupancyPercent)}%`
  }
  return ''
}
