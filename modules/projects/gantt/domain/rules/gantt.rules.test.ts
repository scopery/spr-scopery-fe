import { describe, expect, it } from 'vitest'
import { resolveRecalculatePlanningWindow } from './gantt.rules'

describe('resolveRecalculatePlanningWindow', () => {
  it('uses explicit dates when provided', () => {
    expect(
      resolveRecalculatePlanningWindow({
        planningStartDate: '2026-08-01',
        planningEndDate: '2026-08-31',
      })
    ).toEqual({
      planningStartDate: '2026-08-01',
      planningEndDate: '2026-08-31',
    })
  })

  it('falls back to schedule run window', () => {
    expect(
      resolveRecalculatePlanningWindow({
        scheduleRun: {
          planningStartDate: '2026-07-01T00:00:00Z',
          planningEndDate: '2026-09-30',
        },
      })
    ).toEqual({
      planningStartDate: '2026-07-01',
      planningEndDate: '2026-09-30',
    })
  })

  it('derives from item dates with pad', () => {
    const result = resolveRecalculatePlanningWindow({
      items: [
        { startDate: '2026-08-10', endDate: '2026-08-12' },
        { startDate: '2026-08-20', endDate: '2026-08-22' },
      ],
      padDays: 7,
    })
    // Window covers item span ± pad, and expands to include today when needed.
    expect(result.planningStartDate <= '2026-08-03').toBe(true)
    expect(result.planningEndDate >= '2026-08-29').toBe(true)
  })
})
