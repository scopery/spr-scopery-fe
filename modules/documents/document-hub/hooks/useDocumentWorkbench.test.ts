import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProjectDocumentList, useDocumentFolders } from './useDocumentWorkbench'

vi.mock('../api/document-workbench.api', () => ({
  listProjectDocuments: vi.fn(async () => ({
    items: [{ id: 'd1', projectId: 'p1', title: 'SRS', status: 'DRAFT' }],
  })),
  searchProjectDocuments: vi.fn(async () => ({ items: [] })),
  createProjectDocument: vi.fn(async () => ({
    id: 'd2',
    projectId: 'p1',
    title: 'New',
    status: 'DRAFT',
  })),
  listDocumentFolders: vi.fn(async () => ({
    items: [{ id: 'f1', projectId: 'p1', name: 'Requirements', status: 'ACTIVE' }],
  })),
  createDocumentFolder: vi.fn(async () => ({
    id: 'f2',
    projectId: 'p1',
    name: 'Specs',
    status: 'ACTIVE',
  })),
  archiveDocumentFolder: vi.fn(async () => undefined),
}))

describe('useProjectDocumentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads documents for a project', async () => {
    const { result } = renderHook(() => useProjectDocumentList('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].title).toBe('SRS')
  })

  it('creates a document and refreshes', async () => {
    const api = await import('../api/document-workbench.api')
    const { result } = renderHook(() => useProjectDocumentList('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.create('New doc')
    })
    expect(api.createProjectDocument).toHaveBeenCalledWith('p1', {
      title: 'New doc',
      contentMode: 'NATIVE',
    })
  })
})

describe('useDocumentFolders', () => {
  it('loads folders', async () => {
    const { result } = renderHook(() => useDocumentFolders('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.folders[0].name).toBe('Requirements')
  })
})
