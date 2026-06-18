import { describe, it, expect } from 'vitest'
import { ApiError } from '@/types/api'
import {
  getJoinErrorMessage,
  JOIN_INVITE_ERROR_BY_CODE,
} from './joinInviteErrors'

describe('getJoinErrorMessage', () => {
  it('returns code-specific message for known invite codes', () => {
    expect(
      getJoinErrorMessage(
        new ApiError(409, { type: '', title: '', status: 409, detail: '', code: 'INVITE_EXPIRED' })
      )
    ).toBe('Invite expired. Ask owner to resend.')

    expect(
      getJoinErrorMessage(
        new ApiError(409, { type: '', title: '', status: 409, detail: '', code: 'INVITE_INVALID' })
      )
    ).toBe('Invite invalid. Check the link/token.')

    expect(
      getJoinErrorMessage(
        new ApiError(403, {
          type: '',
          title: '',
          status: 403,
          detail: '',
          code: 'INVITE_EMAIL_MISMATCH',
        })
      )
    ).toBe('This invite was sent to a different email.')

    expect(
      getJoinErrorMessage(
        new ApiError(409, {
          type: '',
          title: '',
          status: 409,
          detail: '',
          code: 'ALREADY_ACCEPTED',
        })
      )
    ).toBe('Invite already used.')
  })

  it('returns generic 403 message for 403 without known code', () => {
    expect(
      getJoinErrorMessage(
        new ApiError(403, { type: '', title: '', status: 403, detail: 'Forbidden' })
      )
    ).toBe("You don't have permission to use this invite.")
  })

  it('returns problem.detail for other ApiError', () => {
    expect(
      getJoinErrorMessage(
        new ApiError(500, {
          type: '',
          title: '',
          status: 500,
          detail: 'Server error',
        })
      )
    ).toBe('Server error')
  })

  it('returns message for generic Error', () => {
    expect(getJoinErrorMessage(new Error('Network failed'))).toBe('Network failed')
  })

  it('returns fallback for non-Error', () => {
    expect(getJoinErrorMessage('string')).toBe('Failed to join organization.')
  })
})

describe('JOIN_INVITE_ERROR_BY_CODE', () => {
  it('has entries for all expected invite error codes', () => {
    expect(JOIN_INVITE_ERROR_BY_CODE['INVITE_EXPIRED']).toBeDefined()
    expect(JOIN_INVITE_ERROR_BY_CODE['INVITE_INVALID']).toBeDefined()
    expect(JOIN_INVITE_ERROR_BY_CODE['INVITE_EMAIL_MISMATCH']).toBeDefined()
    expect(JOIN_INVITE_ERROR_BY_CODE['ALREADY_ACCEPTED']).toBeDefined()
  })
})
