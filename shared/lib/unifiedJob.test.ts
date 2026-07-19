import { describe, expect, it } from 'vitest'
import { mapJobStatusToUi, isJobBusy, isJobTerminal } from '@/shared/lib/unifiedJob'

describe('unifiedJob', () => {
  it('maps BE statuses to UI', () => {
    expect(mapJobStatusToUi('QUEUED')).toBe('queued')
    expect(mapJobStatusToUi('PROCESSING')).toBe('running')
    expect(mapJobStatusToUi('COMPLETED')).toBe('completed')
    expect(mapJobStatusToUi('FAILED')).toBe('failed')
  })

  it('detects busy and terminal states', () => {
    expect(isJobBusy('RUNNING')).toBe(true)
    expect(isJobBusy('COMPLETED')).toBe(false)
    expect(isJobTerminal('FAILED')).toBe(true)
    expect(isJobTerminal('QUEUED')).toBe(false)
  })
})
