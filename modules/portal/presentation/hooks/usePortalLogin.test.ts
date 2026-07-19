import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePortalLogin } from './usePortalLogin'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('../../infrastructure/api/portal.api', () => ({
  portalLogin: vi.fn(async () => ({ ok: true })),
}))

describe('usePortalLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in and redirects to portal projects', async () => {
    const api = await import('../../infrastructure/api/portal.api')
    const { result } = renderHook(() => usePortalLogin())
    await act(async () => {
      await result.current.login('a@b.com', 'secret')
    })
    expect(api.portalLogin).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' })
    expect(push).toHaveBeenCalledWith('/portal/projects')
  })

  it('surfaces login errors', async () => {
    const api = await import('../../infrastructure/api/portal.api')
    vi.mocked(api.portalLogin).mockRejectedValueOnce(new Error('Invalid credentials'))
    const { result } = renderHook(() => usePortalLogin())
    await act(async () => {
      await result.current.login('a@b.com', 'bad')
    })
    await waitFor(() => expect(result.current.error).toBe('Invalid credentials'))
  })
})
