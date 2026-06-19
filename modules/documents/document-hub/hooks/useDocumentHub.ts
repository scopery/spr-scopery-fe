'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import type { DocumentType, DocumentWorkflowStatus } from '@/modules/documents/document'
import * as documentHubApi from '../api/document-hub.api'
import type {
  DocumentHubExportOptions,
  DocumentHubSelectionMode,
} from '../model/document-hub'

interface UseDocumentHubParams {
  orgId: string
  defaultProjectId?: string
  canCreateDocument?: boolean
  canCreateFromTemplate?: boolean
}

export function useDocumentHub({
  orgId,
  defaultProjectId,
  canCreateDocument,
  canCreateFromTemplate = true,
}: UseDocumentHubParams) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId ?? '')
  const [documentType, setDocumentType] = useState('')
  const [originType, setOriginType] = useState('')
  const [aiOnly, setAiOnly] = useState('')
  const [lifecycleStatus, setLifecycleStatus] = useState<'active' | 'archived'>('active')
  const [workflowStatus, setWorkflowStatus] = useState<DocumentWorkflowStatus | ''>('')
  const [projects, setProjects] = useState<documentHubApi.ProjectListItem[]>([])
  const [items, setItems] = useState<documentHubApi.DocumentHubItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState<DocumentHubSelectionMode>('page_selected')
  const [exportOpen, setExportOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [pickProjectOpen, setPickProjectOpen] = useState(false)
  const [createProjectId, setCreateProjectId] = useState('')
  const [pendingCreateProjectId, setPendingCreateProjectId] = useState('')
  const [deliverableOpen, setDeliverableOpen] = useState(false)
  const [deliverableProjectId, setDeliverableProjectId] = useState('')
  const [deliverableSelectedIds, setDeliverableSelectedIds] = useState<string[]>([])
  const [deliverableSelectedTitles, setDeliverableSelectedTitles] = useState<string[]>([])
  const [deliverableLoading, setDeliverableLoading] = useState(false)
  const [pickProjectForDeliverable, setPickProjectForDeliverable] = useState(false)

  const canCreateDeliverable = Boolean(canCreateDocument && canCreateFromTemplate)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    documentHubApi
      .listProjects(orgId)
      .then((res) => setProjects(res.items))
      .catch(() => {})
  }, [orgId])

  const currentFilters = useCallback(
    () => ({
      project_id: projectId || undefined,
      search: debouncedSearch || undefined,
      document_type: documentType || undefined,
      origin_type: originType || undefined,
      generated_by_ai: aiOnly === 'true' ? true : aiOnly === 'false' ? false : undefined,
      status: lifecycleStatus,
      workflow_status: workflowStatus || undefined,
    }),
    [
      projectId,
      debouncedSearch,
      documentType,
      originType,
      aiOnly,
      lifecycleStatus,
      workflowStatus,
    ]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await documentHubApi.listDocumentHubDocuments(orgId, {
        project_id: projectId || undefined,
        search: debouncedSearch || undefined,
        document_type: (documentType || undefined) as DocumentType | undefined,
        origin_type: originType || undefined,
        generated_by_ai: aiOnly === 'true' ? true : aiOnly === 'false' ? false : undefined,
        status: lifecycleStatus,
        workflow_status: workflowStatus || undefined,
        sort: 'updated_at',
        limit: 50,
      })
      setItems(res.items)
      setTotalCount(res.page.total)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [
    orgId,
    projectId,
    debouncedSearch,
    documentType,
    originType,
    aiOnly,
    lifecycleStatus,
    workflowStatus,
  ])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setSelectedIds(new Set())
    setSelectionMode('page_selected')
  }, [
    projectId,
    debouncedSearch,
    documentType,
    originType,
    aiOnly,
    lifecycleStatus,
    workflowStatus,
  ])

  const visibleIds = items.map((item) => item.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const canSelectAllFiltered =
    totalCount > 0 && totalCount <= 100 && allVisibleSelected && totalCount > items.length

  const toggleSelect = (documentId: string) => {
    setSelectionMode('page_selected')
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(documentId)) {
        next.delete(documentId)
      } else {
        next.add(documentId)
      }
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    setSelectionMode('page_selected')
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev)
        for (const id of visibleIds) next.delete(id)
        return next
      }
      const next = new Set(prev)
      for (const id of visibleIds) next.add(id)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setSelectionMode('page_selected')
  }

  const selectAllFiltered = () => {
    setSelectionMode('filtered_all')
  }

  const runHubExport = async (options: DocumentHubExportOptions, previewUsed: boolean) => {
    setExportLoading(true)
    const mode = selectionMode === 'filtered_all' ? 'filtered' : 'selected'
    try {
      await documentHubApi.exportDocumentHub(orgId, {
        mode,
        document_ids: mode === 'selected' ? [...selectedIds] : undefined,
        filters: mode === 'filtered' ? currentFilters() : undefined,
        format: options.format,
        package_format: options.packageFormat,
        include_evidence_index: options.includeEvidenceIndex,
        include_archived: options.includeArchived,
        preview_used: previewUsed,
      })
      toast.success(
        mode === 'filtered' ? 'Filtered documents exported' : 'Selected documents exported'
      )
      setExportOpen(false)
      clearSelection()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed'
      toast.error(msg)
    } finally {
      setExportLoading(false)
    }
  }

  const openCreateFlow = () => {
    if (projectId) {
      setCreateProjectId(projectId)
      setCreateOpen(true)
      return
    }
    if (projects.length === 1) {
      setCreateProjectId(projects[0].id)
      setCreateOpen(true)
      return
    }
    if (projects.length === 0) {
      toast.error('Create a project first, then add documents to it.')
      router.push(ROUTES.org.projects(orgId))
      return
    }
    setPendingCreateProjectId(projects[0]?.id ?? '')
    setPickProjectOpen(true)
  }

  const confirmProjectForCreate = () => {
    if (!pendingCreateProjectId) {
      toast.error('Select a project')
      return
    }
    setCreateProjectId(pendingCreateProjectId)
    setPickProjectOpen(false)
    setCreateOpen(true)
  }

  const handleCreateSuccess = (documentId: string) => {
    setCreateOpen(false)
    void load()
    router.push(ROUTES.org.document(orgId, documentId, createProjectId))
  }

  const openDeliverableWithProject = (
    resolvedProjectId: string,
    docIds: string[],
    titles: string[]
  ) => {
    setDeliverableProjectId(resolvedProjectId)
    setDeliverableSelectedIds(docIds)
    setDeliverableSelectedTitles(titles)
    setDeliverableOpen(true)
  }

  const openDeliverableFlow = async () => {
    if (selectionMode === 'filtered_all') {
      setDeliverableLoading(true)
      try {
        const resolved = await documentHubApi.resolveHubDeliverableSelection(
          orgId,
          currentFilters()
        )
        if (resolved.blocked_reason) {
          toast.error(resolved.blocked_reason)
          return
        }
        if (!resolved.inferred_project_id) {
          toast.error('Could not determine project for filtered documents.')
          return
        }
        openDeliverableWithProject(
          resolved.inferred_project_id,
          resolved.document_ids,
          resolved.document_titles
        )
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to prepare deliverable')
      } finally {
        setDeliverableLoading(false)
      }
      return
    }

    const docIds = [...selectedIds]
    const titles = items.filter((item) => selectedIds.has(item.id)).map((item) => item.title)

    if (docIds.length > 0) {
      setDeliverableLoading(true)
      try {
        const context = await documentHubApi.getHubDeliverableContext(orgId, docIds)
        if (context.blocked_reason) {
          toast.error(context.blocked_reason)
          return
        }
        if (!context.inferred_project_id) {
          toast.error('Could not determine project for selected documents.')
          return
        }
        openDeliverableWithProject(context.inferred_project_id, docIds, titles)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to prepare deliverable')
      } finally {
        setDeliverableLoading(false)
      }
      return
    }

    if (projectId) {
      openDeliverableWithProject(projectId, [], [])
      return
    }
    if (projects.length === 1) {
      openDeliverableWithProject(projects[0].id, [], [])
      return
    }
    setPendingCreateProjectId(projects[0]?.id ?? '')
    setPickProjectForDeliverable(true)
    setPickProjectOpen(true)
  }

  const confirmProjectForDeliverable = () => {
    if (!pendingCreateProjectId) {
      toast.error('Select a project')
      return
    }
    setPickProjectOpen(false)
    setPickProjectForDeliverable(false)
    openDeliverableWithProject(pendingCreateProjectId, [], [])
  }

  const handleDeliverableSuccess = (documentId: string) => {
    setDeliverableOpen(false)
    clearSelection()
    void load()
    router.push(ROUTES.org.document(orgId, documentId, deliverableProjectId))
  }

  const handleRestoreDocument = async (doc: documentHubApi.DocumentHubItem) => {
    if (!doc.project_id) {
      toast.error('Cannot restore document without a project context')
      return
    }
    setRestoringId(doc.id)
    try {
      await documentHubApi.restoreDocument(orgId, doc.id, doc.project_id)
      toast.success('Document restored')
      await load()
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to restore document'
      toast.error(msg)
    } finally {
      setRestoringId(null)
    }
  }

  const closePickProjectModal = () => {
    setPickProjectOpen(false)
    setPickProjectForDeliverable(false)
  }

  return {
    search,
    projectId,
    documentType,
    originType,
    aiOnly,
    lifecycleStatus,
    workflowStatus,
    projects,
    items,
    totalCount,
    selectedIds,
    selectionMode,
    exportOpen,
    exportLoading,
    loading,
    restoringId,
    createOpen,
    pickProjectOpen,
    createProjectId,
    pendingCreateProjectId,
    deliverableOpen,
    deliverableProjectId,
    deliverableSelectedIds,
    deliverableSelectedTitles,
    deliverableLoading,
    pickProjectForDeliverable,
    canCreateDeliverable,
    allVisibleSelected,
    canSelectAllFiltered,
    setSearch,
    setProjectId,
    setDocumentType,
    setOriginType,
    setAiOnly,
    setLifecycleStatus,
    setWorkflowStatus,
    setExportOpen,
    setCreateOpen,
    setPendingCreateProjectId,
    setDeliverableOpen,
    toggleSelect,
    toggleSelectAllVisible,
    clearSelection,
    selectAllFiltered,
    currentFilters,
    runHubExport,
    openCreateFlow,
    confirmProjectForCreate,
    handleCreateSuccess,
    openDeliverableFlow,
    confirmProjectForDeliverable,
    handleDeliverableSuccess,
    handleRestoreDocument,
    closePickProjectModal,
  }
}

export type ProjectListItem = documentHubApi.ProjectListItem
export type DocumentHubItem = documentHubApi.DocumentHubItem
