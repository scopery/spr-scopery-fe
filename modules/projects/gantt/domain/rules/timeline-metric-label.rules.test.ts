import { describe, expect, it } from 'vitest'
import { TimelineMetric } from '../enums/timeline.enum'
import { formatTimelineMetricLabel } from './timeline-metric-label.rules'

const base = {
  scheduled: true,
  plannedMinutes: 120,
  plannedContributionPercent: 25.4,
  actualProgressPercent: 40,
  variancePercent: -12.2,
  occupancyPercent: 75,
  actualIsCarryForward: false,
}

describe('formatTimelineMetricLabel', () => {
  it('returns empty for Schedule mode', () => {
    expect(formatTimelineMetricLabel(TimelineMetric.Schedule, base)).toBe('')
  })

  it('formats effort hours', () => {
    expect(formatTimelineMetricLabel(TimelineMetric.Effort, base)).toBe('2h')
    expect(
      formatTimelineMetricLabel(TimelineMetric.Effort, {
        ...base,
        plannedMinutes: 90,
      })
    ).toBe('1.5h')
  })

  it('formats planned / actual / variance / occupancy', () => {
    expect(formatTimelineMetricLabel(TimelineMetric.PlannedPercent, base)).toBe('25')
    expect(formatTimelineMetricLabel(TimelineMetric.ActualPercent, base)).toBe('40')
    expect(
      formatTimelineMetricLabel(TimelineMetric.ActualPercent, {
        ...base,
        actualIsCarryForward: true,
      })
    ).toBe('~40')
    expect(formatTimelineMetricLabel(TimelineMetric.Variance, base)).toBe('-12')
    expect(formatTimelineMetricLabel(TimelineMetric.Occupancy, base)).toBe('75%')
  })

  it('skips unscheduled / excluded rows', () => {
    expect(
      formatTimelineMetricLabel(TimelineMetric.Effort, { ...base, scheduled: false })
    ).toBe('')
    expect(
      formatTimelineMetricLabel(TimelineMetric.Effort, base, { include: false })
    ).toBe('')
  })
})
