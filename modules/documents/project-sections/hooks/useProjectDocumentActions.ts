'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as projectDocumentsApi from '../api/project-documents.api'
import type { GroupedProjectDocuments, ProjectSection } from '../model/project-section-types'
import type { ProjectDocumentListItem } from '@/modules/documents/document'
import { ApiError } from '@/shared/lib/api-types'

type UseProjectDocumentActionsParams = {
  orgId: string
  projectId: string
  sections: ProjectSection[]
  refetch: () => void | Promise<void>
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.problem.detail
  if (err instanceof Error) return err.message
  return fallback
}

export function useProjectDocumentActions({
  orgId,
  projectId,
  sections,
  refetch,
}: UseProjectDocumentActionsParams) {
  const [pinLoading, setPinLoading] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [handoffExportLoading, setHandoffExportLoading] = useState(false)

  const handlePinToggle = useCallback(
    async (documentId: string, pinned: boolean) => {
      setPinLoading(documentId)
      try {
        await projectDocumentsApi.pinProjectDocument(orgId, projectId, documentId, pinned)
        await refetch()
        toast.success(pinned ? 'Document pinned' : 'Document unpinned')
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to update pin'))
      } finally {
        setPinLoading(null)
      }
    },
    [orgId, projectId, refetch]
  )

  const handleDetach = useCallback(
    async (documentId: string) => {
      try {
        await projectDocumentsApi.detachDocumentFromProject(orgId, projectId, documentId)
        toast.success('Document detached from project')
        await refetch()
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to detach'))
        throw err
      }
    },
    [orgId, projectId, refetch]
  )

  const handleCreateSection = useCallback(
    async (values: { title: string; description: string | null }) => {
      await projectDocumentsApi.createProjectSection(orgId, projectId, values)
      toast.success('Section created')
      await refetch()
    },
    [orgId, projectId, refetch]
  )

  const handleRenameSection = useCallback(
    async (sectionId: string, values: { title: string; description: string | null }) => {
      await projectDocumentsApi.updateProjectSection(orgId, projectId, sectionId, values)
      toast.success('Section updated')
      await refetch()
    },
    [orgId, projectId, refetch]
  )

  const handleArchiveSection = useCallback(
    async (sectionId: string) => {
      setActionLoading(true)
      try {
        await projectDocumentsApi.archiveProjectSection(orgId, projectId, sectionId)
        toast.success('Section archived')
        await refetch()
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to archive section'))
        throw err
      } finally {
        setActionLoading(false)
      }
    },
    [orgId, projectId, refetch]
  )

  const handleCreateDefaults = useCallback(async () => {
    setActionLoading(true)
    try {
      await projectDocumentsApi.createDefaultProjectSections(orgId, projectId)
      toast.success('Default sections created')
      await refetch()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create sections'))
    } finally {
      setActionLoading(false)
    }
  }, [orgId, projectId, refetch])

  const handleMoveSection = useCallback(
    async (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= sections.length) return
      const ids = sections.map((s) => s.id)
      ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
      await projectDocumentsApi.reorderProjectSections(orgId, projectId, ids)
      await refetch()
    },
    [orgId, projectId, sections, refetch]
  )

  const handleMoveDocumentInList = useCallback(
    async (
      docs: ProjectDocumentListItem[],
      index: number,
      direction: 'up' | 'down',
      sectionId: string | null
    ) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= docs.length) return
      const ids = docs.map((d) => d.document_id)
      ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
      await projectDocumentsApi.reorderDocumentsInSection(orgId, projectId, sectionId, ids)
      await refetch()
    },
    [orgId, projectId, refetch]
  )

  const handleMoveDocumentToSection = useCallback(
    async (documentId: string, sectionId: string | null) => {
      await projectDocumentsApi.moveDocumentToSection(orgId, projectId, documentId, sectionId)
      await refetch()
    },
    [orgId, projectId, refetch]
  )

  const handleExportHandoff = useCallback(async () => {
    setHandoffExportLoading(true)
    try {
      await projectDocumentsApi.exportProjectHandoffPackage(orgId, projectId)
      toast.success('Handoff package exported')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export handoff package')
    } finally {
      setHandoffExportLoading(false)
    }
  }, [orgId, projectId])

  return {
    pinLoading,
    actionLoading,
    handoffExportLoading,
    handlePinToggle,
    handleDetach,
    handleCreateSection,
    handleRenameSection,
    handleArchiveSection,
    handleCreateDefaults,
    handleMoveSection,
    handleMoveDocumentInList,
    handleMoveDocumentToSection,
    handleExportHandoff,
  }
}

export type { GroupedProjectDocuments }
