import { describe, expect, it } from 'vitest'
import {
  isMiddlewareAuthEntryPath,
  isMiddlewareProtectedPath,
  isMiddlewarePublicPath,
} from './middleware-paths'

describe('middleware-paths', () => {
  it('identifies protected org and admin paths', () => {
    expect(isMiddlewareProtectedPath('/org/abc')).toBe(true)
    expect(isMiddlewareProtectedPath('/admin/templates')).toBe(true)
    expect(isMiddlewareProtectedPath('/onboarding')).toBe(true)
    expect(isMiddlewareProtectedPath('/auth/login')).toBe(false)
  })

  it('identifies public auth and invite paths', () => {
    expect(isMiddlewarePublicPath('/auth/login')).toBe(true)
    expect(isMiddlewarePublicPath('/invites/token-123')).toBe(true)
    expect(isMiddlewarePublicPath('/suspended')).toBe(true)
    expect(isMiddlewarePublicPath('/org/abc')).toBe(false)
  })

  it('identifies auth entry paths for logged-in redirect', () => {
    expect(isMiddlewareAuthEntryPath('/auth/login')).toBe(true)
    expect(isMiddlewareAuthEntryPath('/auth/register')).toBe(true)
    expect(isMiddlewareAuthEntryPath('/auth/callback')).toBe(false)
  })
})
