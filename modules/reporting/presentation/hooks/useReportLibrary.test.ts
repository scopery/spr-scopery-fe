import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useReportLibrary } from './useReportLibrary'

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
}))

vi.mock('../../infrastructure/api/reporting.api', () => ({
  listReportDefinitions: vi.fn(async () => ({
    items: [{ id: 'd1', code: 'FINANCE', name: 'Finance summary' }],
  })),
  listExportJobs: vi.fn(async () => ({
    items: [{ id: 'e1', status: 'QUEUED', format: 'CSV', reportCode: 'FINANCE' }],
  })),
  startReportRun: vi.fn(async () => ({
    id: 'r1',
    reportCode: 'FINANCE',
    status: 'QUEUED',
    createdAt: '2026-01-01T00:00:00Z',
  })),
  getReportRun: vi.fn(async () => ({
    id: 'r1',
    reportCode: 'FINANCE',
    status: 'COMPLETED',
    createdAt: '2026-01-01T00:00:00Z',
  })),
  requestRunExport: vi.fn(async () => ({
    id: 'e2',
    status: 'QUEUED',
    format: 'CSV',
  })),
  cancelExportJob: vi.fn(async () => undefined),
  openExportDownload: vi.fn(),
}))

describe('useReportLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads definitions and export jobs', async () => {
    const { result } = renderHook(() => useReportLibrary('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.definitions[0].code).toBe('FINANCE')
    expect(result.current.exports).toHaveLength(1)
  })

  it('starts a report run', async () => {
    const api = await import('../../infrastructure/api/reporting.api')
    const { result } = renderHook(() => useReportLibrary('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.runReport('FINANCE')
    })
    expect(api.startReportRun).toHaveBeenCalled()
    expect(result.current.activeRun?.id).toBe('r1')
  })
})
