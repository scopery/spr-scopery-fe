import { describe, expect, it } from 'vitest'
import { TimelineGranularity } from '../enums/timeline.enum'
import {
  autoDailyAllocationMinutes,
  buildBucketsForRow,
  buildTimelineColumns,
} from './timeline-buckets.rules'

describe('autoDailyAllocationMinutes', () => {
  it('splits estimate evenly across Mon–Fri', () => {
    // 2026-08-03 Mon → 2026-08-07 Fri
    const map = autoDailyAllocationMinutes('2026-08-03', '2026-08-07', 40)
    expect([...map.values()].reduce((a, b) => a + b, 0)).toBe(40 * 60)
    expect(map.get('2026-08-03')).toBe(480)
    expect(map.get('2026-08-08')).toBeUndefined()
  })
})

describe('buildBucketsForRow', () => {
  it('computes 20% contribution per day for 40h / 5 days', () => {
    const cols = buildTimelineColumns('2026-08-03', '2026-08-07', TimelineGranularity.Day)
    const buckets = buildBucketsForRow(cols, '2026-08-03', '2026-08-07', 40)
    expect(buckets).toHaveLength(5)
    expect(buckets[0].plannedContributionPercent).toBe(20)
    expect(buckets[2].cumulativePlannedPercent).toBe(60)
    expect(buckets[4].cumulativePlannedPercent).toBe(100)
  })

  it('leaves contribution null without estimate', () => {
    const cols = buildTimelineColumns('2026-08-03', '2026-08-07', TimelineGranularity.Day)
    const buckets = buildBucketsForRow(cols, '2026-08-03', '2026-08-07', null)
    expect(buckets[0].scheduled).toBe(true)
    expect(buckets[0].plannedContributionPercent).toBeNull()
  })
})

describe('buildTimelineColumns smart context labels', () => {
  it('Day: shows month/year on first col and month boundary, weekday otherwise', () => {
    // Jul 31 – Aug 2 2026
    const cols = buildTimelineColumns('2026-07-31', '2026-08-02', TimelineGranularity.Day)
    expect(cols).toHaveLength(3)
    expect(cols[0].label).toBe('31')
    expect(cols[0].subLabel).toMatch(/Jul/)
    expect(cols[0].subLabel).toMatch(/26/)
    expect(cols[1].label).toBe('1')
    expect(cols[1].subLabel).toMatch(/Aug/)
    expect(cols[2].label).toBe('2')
    expect(cols[2].subLabel).toMatch(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/)
  })

  it('Week: marks month context and cross-month weeks', () => {
    // Week containing Jul 31–Aug 2: Mon Jul 27 – Sun Aug 2
    const cols = buildTimelineColumns('2026-07-27', '2026-08-09', TimelineGranularity.Week)
    expect(cols.length).toBeGreaterThanOrEqual(2)
    expect(cols[0].subLabel).toMatch(/Jul|Aug/)
    expect(cols[1].subLabel).toBeTruthy()
  })

  it('Month: year only on first month of each year', () => {
    const cols = buildTimelineColumns('2026-11-01', '2027-02-01', TimelineGranularity.Month)
    expect(cols.map((c) => c.label)).toEqual(['Nov', 'Dec', 'Jan', 'Feb'])
    expect(cols[0].subLabel).toBe('2026')
    expect(cols[1].subLabel).toBeUndefined()
    expect(cols[2].subLabel).toBe('2027')
    expect(cols[3].subLabel).toBeUndefined()
  })

  it('Quarter: year only when year changes', () => {
    const cols = buildTimelineColumns('2026-10-01', '2027-03-01', TimelineGranularity.Quarter)
    expect(cols[0].label).toBe('Q4')
    expect(cols[0].subLabel).toBe('2026')
    expect(cols[1].label).toBe('Q1')
    expect(cols[1].subLabel).toBe('2027')
  })
})
