import { describe, expect, it } from 'vitest'
import { mergePhaseUpdatePayload } from './phase-update.rules'

describe('mergePhaseUpdatePayload', () => {
  const current = {
    code: 'AUTH',
    name: 'Authentication',
    description: 'desc',
    displayOrder: 2,
    plannedStartDate: '2026-08-01',
    plannedEndDate: '2026-08-10',
  }

  it('keeps current name when patch omits name', () => {
    const payload = mergePhaseUpdatePayload(current, {
      plannedStartDate: '2026-08-03',
      plannedEndDate: '2026-08-12',
    })
    expect(payload.name).toBe('Authentication')
    expect(payload.displayOrder).toBe(2)
    expect(payload.plannedStartDate).toBe('2026-08-03')
  })

  it('does not let blank patch name wipe current name', () => {
    const payload = mergePhaseUpdatePayload(current, {
      name: '   ',
      plannedStartDate: '2026-08-03',
      plannedEndDate: '2026-08-12',
    })
    expect(payload.name).toBe('Authentication')
  })

  it('falls back to code when name missing everywhere', () => {
    const payload = mergePhaseUpdatePayload(
      { ...current, name: '' },
      { name: '', plannedStartDate: '2026-08-03', plannedEndDate: '2026-08-12' }
    )
    expect(payload.name).toBe('AUTH')
  })
})
