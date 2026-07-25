import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTraceabilityMatrix } from './useTraceability'

vi.mock('../api/traceability.api', () => ({
  getCoverageMatrix: vi.fn(async () => ({
    items: [
      {
        requirementId: 'r1',
        requirementCode: 'REQ-001',
        requirementTitle: 'SSO',
        hasTestCase: true,
        hasResult: false,
        gap: true,
      },
    ],
  })),
  listTraceLinks: vi.fn(async () => ({
    items: [
      {
        id: 'l1',
        sourceType: 'REQUIREMENT',
        sourceId: 'r1',
        targetType: 'TEST_CASE',
        targetId: 't1',
        linkType: 'TESTED_BY',
      },
    ],
  })),
  createTraceLink: vi.fn(),
}))

vi.mock('@/modules/quality/infrastructure/api/quality.api', () => ({
  listTestCases: vi.fn(async () => ({ items: [] })),
}))

vi.mock('@/modules/projects/requirements/api/requirements.api', () => ({
  listRequirements: vi.fn(async () => ({ items: [] })),
}))

describe('useTraceabilityMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads coverage cells and links', async () => {
    const { result } = renderHook(() => useTraceabilityMatrix('p1', 'ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cells[0].requirementCode).toBe('REQ-001')
    expect(result.current.links[0].linkType).toBe('TESTED_BY')
    expect(result.current.rows.length).toBeGreaterThanOrEqual(1)
    expect(result.current.summary.requirements).toBeGreaterThanOrEqual(1)
  })
})
