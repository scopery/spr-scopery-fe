'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectSectionsService from '@/services/project-sections.service'
import type { GroupedProjectDocuments, ProjectSection } from '@/types/project-section'
import type { DocumentType, DocumentWorkflowStatus } from '@/types/document'

export interface ProjectDocumentsFilters {
  q?: string
  document_type?: DocumentType | ''
  status?: 'active' | 'archived'
  workflow_status?: DocumentWorkflowStatus | ''
  section_id?: string
  pinned_only?: boolean
}

const UNSECTIONED_SECTION_KEY = '__unsectioned__'

export function useProjectDocuments(
  orgId: string | null,
  projectId: string | null,
  filters?: ProjectDocumentsFilters,
) {
  const [grouped, setGrouped] = useState<GroupedProjectDocuments | null>(null)
  const [sections, setSections] = useState<ProjectSection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const [groupedRes, sectionsRes] = await Promise.all([
        projectSectionsService.listProjectDocumentsGrouped(orgId, projectId, {
          q: filters?.q || undefined,
          document_type: filters?.document_type || undefined,
          status: filters?.status ?? 'active',
          workflow_status: filters?.workflow_status || undefined,
          section_id:
            filters?.section_id && filters.section_id !== UNSECTIONED_SECTION_KEY
              ? filters.section_id
              : undefined,
          pinned_only: filters?.pinned_only || undefined,
        }),
        projectSectionsService.listProjectSections(orgId, projectId),
      ])
      setGrouped(groupedRes)
      setSections(sectionsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [
    orgId,
    projectId,
    filters?.q,
    filters?.document_type,
    filters?.status,
    filters?.workflow_status,
    filters?.section_id,
    filters?.pinned_only,
  ])

  useEffect(() => { void loadData() }, [loadData])

  return { grouped, sections, loading, error, refetch: loadData }
}
