import { describe, expect, it } from 'vitest'
import { buildBucketSegment } from './bucket-segment.rules'

describe('buildBucketSegment', () => {
  it('fills full month when item covers entire month', () => {
    const s = buildBucketSegment('2026-07-01', '2026-07-31', '2026-07-01', '2026-07-31')
    expect(s).toEqual({
      startRatio: 0,
      endRatio: 1,
      isFirst: true,
      isLast: true,
    })
  })

  it('partial first month from mid-month start', () => {
    // June has 30 days; start 15 Jun → offset 14 → 14/30
    const s = buildBucketSegment('2026-06-15', '2026-08-10', '2026-06-01', '2026-06-30')
    expect(s).not.toBeNull()
    expect(s!.startRatio).toBeCloseTo(14 / 30, 5)
    expect(s!.endRatio).toBe(1)
    expect(s!.isFirst).toBe(true)
    expect(s!.isLast).toBe(false)
  })

  it('partial last month', () => {
    const s = buildBucketSegment('2026-06-15', '2026-08-10', '2026-08-01', '2026-08-31')
    expect(s).not.toBeNull()
    expect(s!.startRatio).toBe(0)
    expect(s!.endRatio).toBeCloseTo(10 / 31, 5)
    expect(s!.isFirst).toBe(false)
    expect(s!.isLast).toBe(true)
  })

  it('returns null when no overlap', () => {
    expect(
      buildBucketSegment('2026-06-01', '2026-06-10', '2026-07-01', '2026-07-31')
    ).toBeNull()
  })
})
