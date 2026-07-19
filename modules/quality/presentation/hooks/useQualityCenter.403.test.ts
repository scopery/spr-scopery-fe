import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ApiError } from '@/shared/lib/api-types'
import { useQualityCenter } from './useQualityCenter'

vi.mock('../../infrastructure/api/quality.api', () => ({
  listQualityPlans: vi.fn(async () => ({
    items: [{ id: 'qp1', projectId: 'p1', title: 'Q3 Plan', status: 'DRAFT' }],
  })),
  approveQualityPlan: vi.fn(),
  markQualityPlanCurrent: vi.fn(),
}))

describe('useQualityCenter 403', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('surfaces forbidden approve errors without optimistic update', async () => {
    const api = await import('../../infrastructure/api/quality.api')
    vi.mocked(api.approveQualityPlan).mockRejectedValueOnce(
      new ApiError(403, {
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'Missing QUALITY_APPROVE',
      })
    )
    const { result } = renderHook(() => useQualityCenter('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.approve('qp1')
    })
    expect(result.current.actionError).toBe('Missing QUALITY_APPROVE')
    expect(result.current.items[0].status).toBe('DRAFT')
  })
})
