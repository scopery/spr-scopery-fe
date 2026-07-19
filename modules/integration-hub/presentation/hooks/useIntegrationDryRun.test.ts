import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useIntegrationDryRun } from './useIntegrationDryRun'

vi.mock('./useIntegrations', () => ({
  useIntegrations: () => ({
    items: [{ id: 'c1', name: 'Jira', provider: 'JIRA', status: 'ENABLED' }],
    loading: false,
    error: null,
    refetch: vi.fn(async () => undefined),
  }),
}))

vi.mock('@/shared/lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

describe('useIntegrationDryRun', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires dry-run before execute', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    const { result } = renderHook(() => useIntegrationDryRun('ws1'))
    expect(result.current.dryRunComplete).toBe(false)
    await act(async () => {
      await result.current.executeImport()
    })
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('runs dry-run then allows execute', async () => {
    const { apiClient } = await import('@/shared/lib/apiClient')
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({
        jobId: 'job-dry',
        status: 'COMPLETED',
        total: 10,
        success: 10,
        failed: 0,
      })
      .mockResolvedValueOnce({
        jobId: 'job-exec',
        status: 'COMPLETED',
        total: 10,
        success: 9,
        failed: 1,
      })

    const { result } = renderHook(() => useIntegrationDryRun('ws1'))
    await act(async () => {
      await result.current.runDryRun()
    })
    await waitFor(() => expect(result.current.dryRunComplete).toBe(true))
    await act(async () => {
      await result.current.executeImport()
    })
    expect(apiClient.post).toHaveBeenCalledTimes(2)
    expect(result.current.lastResult?.failed).toBe(1)
  })
})
