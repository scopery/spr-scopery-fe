import { describe, expect, it } from 'vitest'
import {
  buildRunCompletionValidation,
  canOverrideReleaseReadiness,
  canRunCaseLifecycle,
  canRunLifecycle,
  evaluateThreshold,
  mapDefectStatusToWorkflow,
  normalizeCaseLifecycleStatus,
  resultRequiresReason,
  validateResultUpdate,
} from './quality.rules'

describe('quality.rules', () => {
  it('normalizes APPROVED case status to READY', () => {
    expect(normalizeCaseLifecycleStatus('APPROVED')).toBe('READY')
    expect(canRunCaseLifecycle('APPROVED', 'deprecate')).toBe(true)
  })

  it('allows run start from draft/planned only', () => {
    expect(canRunLifecycle('DRAFT', 'start')).toBe(true)
    expect(canRunLifecycle('PLANNED', 'start')).toBe(true)
    expect(canRunLifecycle('IN_PROGRESS', 'start')).toBe(false)
    expect(canRunLifecycle('COMPLETED', 'reopen')).toBe(true)
  })

  it('requires reason for failed/blocked results', () => {
    expect(resultRequiresReason('FAILED')).toBe(true)
    expect(validateResultUpdate({ result: 'FAILED', notes: '' }).ok).toBe(false)
    expect(validateResultUpdate({ result: 'PASSED' }).ok).toBe(true)
  })

  it('evaluates NFR thresholds', () => {
    expect(
      evaluateThreshold({ operator: 'LTE', thresholdValue: 200, actualValue: 180 })
    ).toBe(true)
    expect(
      evaluateThreshold({ operator: 'BETWEEN', thresholdValue: 1, secondaryThresholdValue: 5, actualValue: 3 })
    ).toBe(true)
    expect(
      evaluateThreshold({ operator: 'GT', thresholdValue: 99, actualValue: 99 })
    ).toBe(false)
  })

  it('builds completion validation with violations', () => {
    const validation = buildRunCompletionValidation({
      runId: 'r1',
      counts: { total: 10, passed: 7, failed: 1, blocked: 1, skipped: 0, notRun: 1 },
    })
    expect(validation.canComplete).toBe(false)
    expect(validation.violations.map((v) => v.code)).toEqual(
      expect.arrayContaining(['NOT_RUN_REMAINING', 'FAILED_REMAINING', 'BLOCKED_REMAINING'])
    )
  })

  it('gates release override on permission, reason, and approver', () => {
    expect(
      canOverrideReleaseReadiness({
        readinessStatus: 'BLOCKED',
        hasPermission: true,
        reason: 'Accepted residual risk',
        approverUserId: 'u1',
      }).ok
    ).toBe(true)
    expect(
      canOverrideReleaseReadiness({
        readinessStatus: 'BLOCKED',
        hasPermission: true,
        reason: '',
        approverUserId: 'u1',
      }).ok
    ).toBe(false)
  })

  it('maps rich defect statuses into workflow buckets', () => {
    expect(mapDefectStatusToWorkflow('READY_FOR_RETEST')).toBe('RETEST')
    expect(mapDefectStatusToWorkflow('TRIAGED')).toBe('OPEN')
  })
})
