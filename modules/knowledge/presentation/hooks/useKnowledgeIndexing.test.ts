import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useKnowledgeIndexing } from './useKnowledgeIndexing'

vi.mock('../../infrastructure/api/knowledge', () => ({
  listIndexingJobs: vi.fn(async () => ({
    items: [{ id: 'j1', status: 'COMPLETED', jobType: 'KNOWLEDGE_REINDEX' }],
  })),
  listDocumentClassifications: vi.fn(async () => ({ items: [] })),
  startWorkspaceReindex: vi.fn(async () => ({
    id: 'j2',
    status: 'QUEUED',
    jobType: 'KNOWLEDGE_REINDEX',
  })),
}))

describe('useKnowledgeIndexing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads indexing jobs', async () => {
    const { result } = renderHook(() => useKnowledgeIndexing('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.jobs[0].id).toBe('j1')
  })

  it('starts a workspace reindex', async () => {
    const api = await import('../../infrastructure/api/knowledge')
    const { result } = renderHook(() => useKnowledgeIndexing('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.startReindex()
    })
    expect(api.startWorkspaceReindex).toHaveBeenCalledWith('ws1')
  })
})
