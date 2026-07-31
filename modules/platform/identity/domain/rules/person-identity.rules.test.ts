import { describe, expect, it } from 'vitest'
import { formatPersonLabel, mapIamUserToPerson, shortUserId } from './person-identity.rules'

const technicalId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

describe('person identity labels', () => {
  it('never exposes a technical ID as a fallback label', () => {
    expect(shortUserId(technicalId)).toBe('—')
    expect(formatPersonLabel(null, technicalId)).toBe('—')
  })

  it('uses a neutral label when IAM data has no readable identity', () => {
    expect(
      mapIamUserToPerson({
        id: technicalId,
        fullName: '',
        email: '',
        username: '',
      }).fullName
    ).toBe('—')
  })
})
