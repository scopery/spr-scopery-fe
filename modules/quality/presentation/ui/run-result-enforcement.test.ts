import { describe, expect, it } from 'vitest'
import { validateResultUpdate, buildRunCompletionValidation } from '../../domain/rules/quality.rules'

describe('run result reason enforcement', () => {
  it('blocks failed without notes and allows passed', () => {
    expect(validateResultUpdate({ result: 'FAILED' }).ok).toBe(false)
    expect(validateResultUpdate({ result: 'FAILED', notes: 'assert mismatch' }).ok).toBe(true)
    expect(validateResultUpdate({ result: 'PASSED' }).ok).toBe(true)
  })

  it('blocks complete when not-run or failed remain', () => {
    const validation = buildRunCompletionValidation({
      runId: 'run-1',
      counts: { total: 5, passed: 3, failed: 1, blocked: 0, skipped: 0, notRun: 1 },
    })
    expect(validation.canComplete).toBe(false)
    expect(validation.violations).toHaveLength(2)
  })
})
