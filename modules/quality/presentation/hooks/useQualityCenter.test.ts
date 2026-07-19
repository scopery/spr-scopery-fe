import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useQualityCenter } from './useQualityCenter'

vi.mock('../../infrastructure/api/quality.api', () => ({
  listQualityPlans: vi.fn(async () => ({
    items: [{ id: 'qp1', projectId: 'p1', title: 'Q3 Plan', status: 'DRAFT' }],
  })),
  approveQualityPlan: vi.fn(async () => ({
    id: 'qp1',
    projectId: 'p1',
    title: 'Q3 Plan',
    status: 'APPROVED',
  })),
  markQualityPlanCurrent: vi.fn(async () => ({
    id: 'qp1',
    projectId: 'p1',
    title: 'Q3 Plan',
    status: 'CURRENT',
  })),
}))

describe('useQualityCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads quality plans', async () => {
    const { result } = renderHook(() => useQualityCenter('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items[0].title).toBe('Q3 Plan')
  })

  it('approves a plan via API then refreshes', async () => {
    const api = await import('../../infrastructure/api/quality.api')
    const { result } = renderHook(() => useQualityCenter('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.approve('qp1')
    })
    expect(api.approveQualityPlan).toHaveBeenCalledWith('p1', 'qp1')
  })
})
