import { describe, expect, it } from 'vitest'
import {
  isMiddlewareAuthEntryPath,
  isMiddlewareProtectedPath,
  isMiddlewarePublicPath,
} from './middleware-paths'

describe('middleware-paths', () => {
  it('identifies protected workspace and admin paths', () => {
    expect(isMiddlewareProtectedPath('/workspace/abc')).toBe(true)
    expect(isMiddlewareProtectedPath('/admin/ai-control')).toBe(true)
    expect(isMiddlewareProtectedPath('/onboarding')).toBe(true)
    expect(isMiddlewareProtectedPath('/auth/login')).toBe(false)
  })

  it('identifies public auth and invite paths', () => {
    expect(isMiddlewarePublicPath('/auth/login')).toBe(true)
    expect(isMiddlewarePublicPath('/invites/token-123')).toBe(true)
    expect(isMiddlewarePublicPath('/suspended')).toBe(true)
    expect(isMiddlewarePublicPath('/workspace/abc')).toBe(false)
  })

  it('identifies auth entry paths for logged-in redirect', () => {
    expect(isMiddlewareAuthEntryPath('/auth/login')).toBe(true)
    expect(isMiddlewareAuthEntryPath('/auth/register')).toBe(true)
    expect(isMiddlewareAuthEntryPath('/auth/callback')).toBe(false)
  })
})
