'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GroupedProjectDocuments, ProjectSection } from '../model/project-section-types'
import * as projectDocumentsApi from '../api/project-documents.api'
import type { ProjectDocumentsFilters } from '../model/project-documents'

export function useProjectDocuments(
  orgId: string | null,
  projectId: string | null,
  filters?: ProjectDocumentsFilters
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
      const res = await projectDocumentsApi.listProjectDocumentsWorkspace(orgId, projectId, filters)
      setGrouped(res.grouped)
      setSections(res.sections)
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

  useEffect(() => {
    void loadData()
  }, [loadData])

  return { grouped, sections, loading, error, refetch: loadData }
}
