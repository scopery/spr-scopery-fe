import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectDocumentActions } from './useProjectDocumentActions'
import * as projectDocumentsApi from '../api/project-documents.api'

vi.mock('../api/project-documents.api', () => ({
  pinProjectDocument: vi.fn(),
  detachDocumentFromProject: vi.fn(),
  createProjectSection: vi.fn(),
  updateProjectSection: vi.fn(),
  archiveProjectSection: vi.fn(),
  createDefaultProjectSections: vi.fn(),
  reorderProjectSections: vi.fn(),
  reorderDocumentsInSection: vi.fn(),
  moveDocumentToSection: vi.fn(),
  exportProjectHandoffPackage: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

describe('useProjectDocumentActions', () => {
  const refetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    refetch.mockResolvedValue(undefined)
  })

  it('pins a document and refetches', async () => {
    vi.mocked(projectDocumentsApi.pinProjectDocument).mockResolvedValue(undefined as never)

    const { result } = renderHook(() =>
      useProjectDocumentActions({
        orgId: 'org1',
        projectId: 'p1',
        sections: [],
        refetch,
      })
    )

    await act(async () => {
      await result.current.handlePinToggle('doc1', true)
    })

    expect(projectDocumentsApi.pinProjectDocument).toHaveBeenCalledWith('org1', 'p1', 'doc1', true)
    expect(refetch).toHaveBeenCalled()
  })

  it('creates a section and refetches', async () => {
    vi.mocked(projectDocumentsApi.createProjectSection).mockResolvedValue({ id: 's1' } as never)

    const { result } = renderHook(() =>
      useProjectDocumentActions({
        orgId: 'org1',
        projectId: 'p1',
        sections: [],
        refetch,
      })
    )

    await act(async () => {
      await result.current.handleCreateSection({ title: 'New', description: null })
    })

    expect(projectDocumentsApi.createProjectSection).toHaveBeenCalled()
    expect(refetch).toHaveBeenCalled()
  })
})
