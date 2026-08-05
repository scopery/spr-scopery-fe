import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/lib/api-types'
import { isRequirementLinkConflict } from './requirement-link.rules'

describe('isRequirementLinkConflict', () => {
  it('returns true for known duplicate link codes', () => {
    for (const code of ['TRACE_LINK_EXISTS', 'LINK_EXISTS', 'RESOURCE_CONFLICT', 'ALREADY_EXISTS']) {
      expect(
        isRequirementLinkConflict(
          new ApiError(409, { type: '', title: '', status: 409, detail: '', code })
        )
      ).toBe(true)
    }
  })

  it('returns false for other errors', () => {
    expect(
      isRequirementLinkConflict(
        new ApiError(409, { type: '', title: '', status: 409, detail: '', code: 'REQ_CODE_EXISTS' })
      )
    ).toBe(false)
    expect(isRequirementLinkConflict(new Error('nope'))).toBe(false)
  })
})
