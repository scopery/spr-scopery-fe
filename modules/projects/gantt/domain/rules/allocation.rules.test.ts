import { describe, expect, it } from 'vitest'
import {
  allocationBalance,
  occupancyPercent,
  seedManualFromAuto,
  setDayMinutes,
} from './allocation.rules'

describe('seedManualFromAuto', () => {
  it('creates editable day map for Mon–Fri 40h', () => {
    const plan = seedManualFromAuto('t1', '2026-08-03', '2026-08-07', 40)
    expect(Object.keys(plan.days)).toHaveLength(5)
    expect(allocationBalance(plan, 40).deltaMinutes).toBe(0)
  })
})

describe('setDayMinutes + balance', () => {
  it('reports unallocated hours', () => {
    let plan = seedManualFromAuto('t1', '2026-08-03', '2026-08-07', 40)
    plan = setDayMinutes(plan, '2026-08-03', 0)
    const bal = allocationBalance(plan, 40)
    expect(bal.deltaMinutes).toBe(480)
  })
})

describe('occupancyPercent', () => {
  it('is 75% for 6h on 8h day', () => {
    expect(occupancyPercent(360)).toBe(75)
  })
})
