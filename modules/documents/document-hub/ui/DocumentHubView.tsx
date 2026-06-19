'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Plus, RotateCcw, Search, Download, FileOutput } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  Typography,
  ContentLoader,
  Badge,
  Modal,
  Checkbox,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { AIGeneratedBadge, originLabel } from '@/modules/ai-document-intelligence'
import {
  DocumentTypeBadge,
  WorkflowStatusBadge,
  CreateDeliverableDialog,
  CreateDocumentModal,
} from '@/modules/documents'
import { DocumentHubExportDialog } from './DocumentHubExportDialog'
import * as documentHubApi from '../api/document-hub.api'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_WORKFLOW_STATUS_OPTIONS,
  type DocumentWorkflowStatus,
} from '@/modules/documents/document'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import type {
  DocumentHubExportOptions,
  DocumentHubSelectionMode,
  DocumentHubViewProps,
} from '../model/document-hub'

export function DocumentHubView({
  orgId,
  defaultProjectId,
  canCreateDocument,
  canCreateFromTemplate = true,
  canRestoreDocument = false,
  canExportDocuments = false,
}: DocumentHubViewProps) {
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await documentHubApi.listDocumentHubDocuments(orgId, {
        project_id: projectId || undefined,
        search: debouncedSearch || undefined,
        document_type: (documentType || undefined) as
          | import('@/modules/documents/document').DocumentType
          | undefined,
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
    load()
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

  const currentFilters = () => ({
    project_id: projectId || undefined,
    search: debouncedSearch || undefined,
    document_type: documentType || undefined,
    origin_type: originType || undefined,
    generated_by_ai: aiOnly === 'true' ? true : aiOnly === 'false' ? false : undefined,
    status: lifecycleStatus,
    workflow_status: workflowStatus || undefined,
  })

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography as="h1" variant="h1" weight="semibold">
            Document Hub
          </Typography>
          <Typography tone="muted" className="mt-1">
            Search and manage project knowledge across your workspace.
          </Typography>
        </div>
        {canCreateDocument && (
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreateFlow}>
            New document
          </Button>
        )}
        {canExportDocuments && (
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={16} />}
            disabled={selectedIds.size === 0 && totalCount === 0}
            onClick={() => setExportOpen(true)}
          >
            Export
          </Button>
        )}
        {canCreateDeliverable && (
          <Button
            variant="outline"
            size="sm"
            icon={<FileOutput size={16} />}
            loading={deliverableLoading}
            onClick={() => void openDeliverableFlow()}
          >
            {selectedIds.size > 0 ? 'Create deliverable from selected' : 'Create deliverable'}
          </Button>
        )}
      </div>

      {canExportDocuments && (selectedIds.size > 0 || selectionMode === 'filtered_all') && (
        <div className="flex flex-wrap items-center gap-3 border border-neutral-200 bg-neutral-50 px-3 py-2">
          {selectionMode === 'filtered_all' ? (
            <Typography variant="small">
              All {totalCount} matching documents selected for export
            </Typography>
          ) : (
            <Typography variant="small">{selectedIds.size} selected on this page</Typography>
          )}
          {canSelectAllFiltered && selectionMode !== 'filtered_all' && (
            <Button variant="outline" size="sm" onClick={selectAllFiltered}>
              Select all {totalCount} matching documents
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear selection
          </Button>
          <Button variant="primary" size="sm" onClick={() => setExportOpen(true)}>
            Export
          </Button>
          {canCreateDeliverable ? (
            <Button
              variant="outline"
              size="sm"
              loading={deliverableLoading}
              onClick={() => void openDeliverableFlow()}
            >
              Create deliverable
            </Button>
          ) : null}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <div className="relative lg:col-span-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size={16}
          />
          <Input
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            fullWidth
          />
        </div>
        <Select
          value={projectId || '__all__'}
          onValueChange={(v: string) => setProjectId(v === '__all__' ? '' : v)}
          options={[
            { value: '__all__', label: 'All projects' },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <Select
          value={documentType || '__all__'}
          onValueChange={(v: string) => setDocumentType(v === '__all__' ? '' : v)}
          options={[
            { value: '__all__', label: 'All types' },
            ...DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          ]}
        />
        <Select
          value={originType || '__all__'}
          onValueChange={(v: string) => setOriginType(v === '__all__' ? '' : v)}
          options={[
            { value: '__all__', label: 'All origins' },
            { value: 'manual', label: 'Manual' },
            { value: 'ai_generated', label: 'AI generated' },
            { value: 'project_summary', label: 'Project brief' },
            { value: 'document_summary', label: 'Summary' },
            { value: 'qa_session', label: 'QA session' },
            { value: 'clarity_assessment', label: 'Clarity' },
            { value: 'readiness_summary', label: 'Readiness' },
          ]}
        />
        <Select
          value={aiOnly || '__all__'}
          onValueChange={(v: string) => setAiOnly(v === '__all__' ? '' : v)}
          options={[
            { value: '__all__', label: 'AI: any' },
            { value: 'true', label: 'AI generated only' },
            { value: 'false', label: 'Not AI generated' },
          ]}
        />
        <Select
          value={lifecycleStatus}
          onValueChange={(v: string) => setLifecycleStatus(v as 'active' | 'archived')}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
        <Select
          value={workflowStatus || '__all__'}
          onValueChange={(v: string) =>
            setWorkflowStatus(v === '__all__' ? '' : (v as DocumentWorkflowStatus))
          }
          options={[
            { value: '__all__', label: 'All workflow' },
            ...DOCUMENT_WORKFLOW_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <ContentLoader variant="easeOut" className="w-20" />
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-white p-12 text-center">
          <FileText className="mx-auto mb-3 text-neutral-400" size={32} />
          <Typography weight="medium">No documents found</Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Try adjusting filters or create a document in a project.
          </Typography>
          {canCreateDocument && (
            <Button variant="primary" size="sm" className="mt-4" onClick={openCreateFlow}>
              New document
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {canExportDocuments && items.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              <Checkbox
                checked={selectionMode === 'filtered_all' || allVisibleSelected}
                onChange={toggleSelectAllVisible}
                aria-label="Select all visible documents"
              />
              <Typography variant="small" tone="muted">
                {selectionMode === 'filtered_all'
                  ? `All ${totalCount} matching documents selected`
                  : `Select all on this page (${items.length})`}
              </Typography>
            </div>
          )}
          {items.map((doc) => {
            const isArchived = doc.status === 'archived'
            const isSelected = selectionMode === 'filtered_all' || selectedIds.has(doc.id)
            const cardContent = (
              <>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {canExportDocuments && (
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleSelect(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${doc.title}`}
                    />
                  )}
                  <Typography as="span" weight="semibold">
                    {doc.title}
                  </Typography>
                  <DocumentTypeBadge type={doc.document_type} />
                  {doc.workflow_status && <WorkflowStatusBadge status={doc.workflow_status} />}
                  {isArchived && (
                    <Badge variant="soft" tone="warning" size="sm">
                      Archived
                    </Badge>
                  )}
                  <AIGeneratedBadge
                    generatedByAI={doc.generated_by_ai}
                    originType={doc.origin_type}
                  />
                  {doc.origin_type !== 'manual' && (
                    <Badge variant="soft" tone="neutral" size="sm">
                      {originLabel(doc.origin_type)}
                    </Badge>
                  )}
                  {(doc.link_count ?? 0) > 0 && (
                    <Badge variant="soft" tone="info" size="sm">
                      {doc.link_count} link{(doc.link_count ?? 0) === 1 ? '' : 's'}
                    </Badge>
                  )}
                </div>
                <div className="mb-2 flex flex-wrap gap-3 text-sm text-neutral-500">
                  {doc.project_name && <span>{doc.project_name}</span>}
                  {doc.section_name && <span>· {doc.section_name}</span>}
                  {doc.creator_display_name && <span>· {doc.creator_display_name}</span>}
                  <span>· {new Date(doc.updated_at).toLocaleDateString()}</span>
                </div>
                <Typography variant="small" tone="muted" className="line-clamp-2">
                  {doc.snippet}
                </Typography>
                {canRestoreDocument && isArchived && doc.project_id && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<RotateCcw size={14} />}
                      loading={restoringId === doc.id}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        void handleRestoreDocument(doc)
                      }}
                    >
                      Restore document
                    </Button>
                  </div>
                )}
              </>
            )

            if (isArchived) {
              return (
                <div key={doc.id} className="block border border-neutral-200 bg-neutral-50 p-4">
                  {cardContent}
                </div>
              )
            }

            return (
              <Link
                key={doc.id}
                href={ROUTES.org.document(orgId, doc.id, doc.project_id ?? undefined)}
                className="block border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300"
              >
                {cardContent}
              </Link>
            )
          })}
        </div>
      )}

      <Modal
        open={pickProjectOpen}
        onClose={() => {
          setPickProjectOpen(false)
          setPickProjectForDeliverable(false)
        }}
        title="Choose project"
        size="sm"
      >
        <div className="space-y-4">
          <Typography variant="small" tone="muted">
            {pickProjectForDeliverable
              ? 'Select the project context for deliverable generation.'
              : 'Documents belong to a project. Select where to create this document.'}
          </Typography>
          <Select
            label="Project"
            value={pendingCreateProjectId}
            onValueChange={setPendingCreateProjectId}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPickProjectOpen(false)
                setPickProjectForDeliverable(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={
                pickProjectForDeliverable ? confirmProjectForDeliverable : confirmProjectForCreate
              }
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {createProjectId && (
        <CreateDocumentModal
          orgId={orgId}
          projectId={createProjectId}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
          canCreateFromTemplate={canCreateFromTemplate}
        />
      )}

      {deliverableProjectId ? (
        <CreateDeliverableDialog
          orgId={orgId}
          projectId={deliverableProjectId}
          open={deliverableOpen}
          onClose={() => setDeliverableOpen(false)}
          onSuccess={handleDeliverableSuccess}
          entryContext="document_hub"
          initialSelectedDocumentIds={deliverableSelectedIds}
          selectedDocumentTitles={deliverableSelectedTitles}
        />
      ) : null}

      {canExportDocuments && (
        <DocumentHubExportDialog
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          orgId={orgId}
          selectionMode={selectionMode}
          selectedCount={selectedIds.size}
          totalCount={totalCount}
          filters={currentFilters()}
          documentIds={[...selectedIds]}
          lifecycleStatus={lifecycleStatus}
          loading={exportLoading}
          onExport={runHubExport}
        />
      )}
    </div>
  )
}
