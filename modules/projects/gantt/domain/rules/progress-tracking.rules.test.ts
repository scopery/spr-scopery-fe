import { describe, expect, it } from 'vitest'
import type { TaskProgressSnapshot } from '../model/progress-snapshot'
import {
  cumulativePlannedAsOf,
  isProgressAtRisk,
  resolveActualProgressAsOf,
  variancePercent,
} from './progress-tracking.rules'

const snaps: TaskProgressSnapshot[] = [
  {
    taskId: 't1',
    snapshotDate: '2026-08-03',
    progressPercent: 15,
    timeSpentMinutes: null,
    note: null,
    recordedAt: '2026-08-03T10:00:00Z',
  },
  {
    taskId: 't1',
    snapshotDate: '2026-08-05',
    progressPercent: 45,
    timeSpentMinutes: 240,
    note: 'mid',
    recordedAt: '2026-08-05T18:00:00Z',
  },
]

describe('resolveActualProgressAsOf', () => {
  it('returns last snapshot on/before date and marks carry-forward', () => {
    const onDay = resolveActualProgressAsOf(snaps, 't1', '2026-08-05')
    expect(onDay).toMatchObject({ percent: 45, isCarryForward: false })
    const carry = resolveActualProgressAsOf(snaps, 't1', '2026-08-06')
    expect(carry).toMatchObject({ percent: 45, isCarryForward: true })
    expect(resolveActualProgressAsOf(snaps, 't1', '2026-08-02')).toBeNull()
  })
})

describe('cumulativePlannedAsOf', () => {
  it('matches 60% by end of Wed for 40h Mon–Fri', () => {
    // Mon 3 – Fri 7 Aug 2026
    expect(cumulativePlannedAsOf('2026-08-03', '2026-08-07', 40, '2026-08-05')).toBe(60)
  })
})

describe('variance + at-risk', () => {
  it('flags large negative variance', () => {
    expect(variancePercent(45, 60)).toBe(-15)
    expect(isProgressAtRisk(-15)).toBe(true)
    expect(isProgressAtRisk(-5)).toBe(false)
  })
})
