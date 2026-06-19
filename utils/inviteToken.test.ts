import { describe, it, expect } from 'vitest'
import { parseInviteToken } from './inviteToken'

describe('parseInviteToken', () => {
  it('returns token when given raw token (12+ safe chars)', () => {
    const token = 'Abc123def_GHI-456'
    expect(parseInviteToken(token)).toBe(token)
    expect(parseInviteToken('  ' + token + '  ')).toBe(token)
  })

  it('extracts token from full URL with /invites/', () => {
    expect(parseInviteToken('https://app.example.com/invites/Abc123def_GHI-456')).toBe(
      'Abc123def_GHI-456'
    )
    expect(parseInviteToken('/invites/Abc123def_GHI-456')).toBe('Abc123def_GHI-456')
    expect(parseInviteToken('https://x/invites/Abc123def_GHI-456?foo=bar')).toBe(
      'Abc123def_GHI-456'
    )
    expect(parseInviteToken('https://x/invites/Abc123def_GHI-456#hash')).toBe('Abc123def_GHI-456')
  })

  it('uses segment after last /invites/ when multiple', () => {
    expect(parseInviteToken('https://x/invites/other/invites/Abc123def_GHI-456')).toBe(
      'Abc123def_GHI-456'
    )
  })

  it('throws on empty or whitespace-only', () => {
    expect(() => parseInviteToken('')).toThrow('Please enter an invite link or token.')
    expect(() => parseInviteToken('   ')).toThrow('Please enter an invite link or token.')
  })

  it('throws when token contains spaces', () => {
    expect(() => parseInviteToken('Abc 123')).toThrow(
      'Invite link or token should not contain spaces.'
    )
  })

  it('throws when token too short or invalid chars', () => {
    expect(() => parseInviteToken('short')).toThrow(
      'Invite token format is invalid. Paste the full link or token.'
    )
    expect(() => parseInviteToken('Abc123def_GHI!')).toThrow(
      'Invite token format is invalid. Paste the full link or token.'
    )
  })

  it('accepts token with exactly 12 safe chars', () => {
    expect(parseInviteToken('Abc123def_GH')).toBe('Abc123def_GH')
  })

  it('throws when link has /invites/ but no valid token segment after', () => {
    expect(() => parseInviteToken('https://x/invites/')).toThrow(
      'Invite token format is invalid. Paste the full link or token.'
    )
    expect(() => parseInviteToken('https://x/invites/?q=1')).toThrow(
      'Invite token format is invalid. Paste the full link or token.'
    )
  })
})
