import { describe, it, expect } from 'vitest'
import {
  getGovernanceBlockedMessage,
  getGovernanceBlockedReasons,
  getGovernanceWarningMessages,
  isGovernanceDeniedError,
  isGovernancePreviewDenied,
  parseGovernanceErrorDetails,
} from './governanceError'
import { ApiError } from '@/types/api'

describe('governanceError', () => {
  const governanceProblem = {
    type: 'about:blank',
    title: 'Forbidden',
    status: 403,
    detail: 'Export blocked',
    code: 'GOVERNANCE_ACTION_DENIED',
    blocked_reasons: ['Export blocked because readiness is blocked.'],
    action_key: 'document.export',
  }

  it('detects GOVERNANCE_ACTION_DENIED ApiError', () => {
    const err = new ApiError(403, governanceProblem)
    expect(isGovernanceDeniedError(err)).toBe(true)
    expect(getGovernanceBlockedMessage(err)).toBe('Export blocked because readiness is blocked.')
  })

  it('parseGovernanceErrorDetails extracts safe fields', () => {
    const err = new ApiError(403, {
      ...governanceProblem,
      detail: 'Blocked',
      blocked_reasons: ['Policy denied export'],
      suggested_actions: ['Contact admin'],
    })
    const details = parseGovernanceErrorDetails(err.problem)
    expect(details.blocked_reasons).toEqual(['Policy denied export'])
    expect(details.suggested_actions).toEqual(['Contact admin'])
    expect(details.action_key).toBe('document.export')
  })

  it('getGovernanceWarningMessages prefers warnings array', () => {
    const messages = getGovernanceWarningMessages({
      warnings: ['Export may include archived documents'],
    })
    expect(messages).toEqual(['Export may include archived documents'])
  })

  it('getGovernanceWarningMessages hides rule internals without view permission', () => {
    const messages = getGovernanceWarningMessages(
      {
        matched_rules: [{ explanation: 'Internal rule detail' }],
      },
      false
    )
    expect(messages).toEqual([])
  })

  it('getGovernanceBlockedReasons returns reasons when denied', () => {
    const reasons = getGovernanceBlockedReasons({
      allowed: false,
      blocked_reasons: ['Policy denied deliverable create'],
    })
    expect(reasons).toEqual(['Policy denied deliverable create'])
  })

  it('isGovernancePreviewDenied detects allowed=false', () => {
    expect(isGovernancePreviewDenied({ allowed: false })).toBe(true)
    expect(isGovernancePreviewDenied({ allowed: true })).toBe(false)
  })
})
