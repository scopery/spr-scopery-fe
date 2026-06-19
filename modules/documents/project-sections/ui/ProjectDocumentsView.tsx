'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Link2, Search, FolderPlus, LayoutTemplate, Download, FileOutput } from 'lucide-react'
import { Typography, Button, Badge, ContentLoader, Input, Select, ConfirmDialog } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useProject } from '@/modules/projects'
import { useOrg } from '@/modules/org'
import { useEffectivePermissions } from '@/modules/permissions'
import {
  buildDocumentSpacePermissions,
  buildAIPermissions,
  canManageProjectContentFallback,
  resolveProjectRole,
} from '@/utils/permissions'
import { ProjectAIActionsMenu } from '@/modules/ai-document-intelligence'
import {
  ProjectStepIndicator,
  buildProjectFlowSteps,
  PROJECT_FLOW_STEP_IDS,
} from '@/modules/projects'
import {
  CreateDocumentModal,
  EmptyDocumentsState,
  CreateDeliverableDialog,
  DeliverableHistoryPanel,
  AttachDocumentModal,
  ProjectSectionGroup,
  SectionFormDialog,
  MoveDocumentToSectionDialog,
  useProjectDocuments,
} from '@/modules/documents'
import { projectDocumentsApi } from '@/modules/documents'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_WORKFLOW_STATUS_OPTIONS,
  type DocumentType,
  type DocumentWorkflowStatus,
} from '@/modules/documents'
import { UNSECTIONED_SECTION_KEY } from '@/modules/documents'
import type { GroupedProjectDocuments, ProjectSection } from '@/modules/documents'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'

export function ProjectDocumentsView() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const projectId = params.projectId as string

  const { project, loading: projectLoading } = useProject(orgId, projectId)
  const { org } = useOrg(orgId)
  const { permissions: effectivePermissions } = useEffectivePermissions(orgId, projectId)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active')
  const [workflowFilter, setWorkflowFilter] = useState<DocumentWorkflowStatus | ''>('')
  const [sectionFilter, setSectionFilter] = useState<string>('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [deliverableOpen, setDeliverableOpen] = useState(false)
  const [createSectionId, setCreateSectionId] = useState<string | null>(null)
  const [attachOpen, setAttachOpen] = useState(false)
  const [attachSectionId, setAttachSectionId] = useState<string | null>(null)
  const [sectionFormOpen, setSectionFormOpen] = useState(false)
  const [sectionFormMode, setSectionFormMode] = useState<'create' | 'rename'>('create')
  const [editingSection, setEditingSection] = useState<ProjectSection | null>(null)
  const [archiveSectionTarget, setArchiveSectionTarget] = useState<ProjectSection | null>(null)
  const [moveDocumentId, setMoveDocumentId] = useState<string | null>(null)
  const [pinLoading, setPinLoading] = useState<string | null>(null)
  const [detachTarget, setDetachTarget] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [handoffExportLoading, setHandoffExportLoading] = useState(false)

  const {
    grouped,
    sections,
    loading: docsLoading,
    refetch: refetchDocs,
  } = useProjectDocuments(orgId, projectId, {
    q: debouncedSearch,
    document_type: typeFilter,
    status: statusFilter,
    workflow_status: workflowFilter,
    section_id: sectionFilter,
    pinned_only: pinnedOnly,
  })
  const loading = projectLoading || docsLoading

  const projectRole = resolveProjectRole(project?.my_role)
  const fallbackEditable = project
    ? canManageProjectContentFallback(org?.my_role ?? 'member', projectRole)
    : false
  const docPerms = buildDocumentSpacePermissions(effectivePermissions, fallbackEditable)
  const aiPerms = buildAIPermissions(effectivePermissions, fallbackEditable)
  const canManageDocuments =
    docPerms.canCreateDocument ||
    docPerms.canAttachDocument ||
    docPerms.canPinDocument ||
    docPerms.canMoveDocument ||
    docPerms.canDetachDocument
  const canManageSections =
    docPerms.canCreateSection || docPerms.canUpdateSection || docPerms.canArchiveSection

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const flowSteps = buildProjectFlowSteps(orgId, projectId, PROJECT_FLOW_STEP_IDS.documents, {
    project: ROUTES.org.project(orgId, projectId),
    questions: ROUTES.org.projectQuestions(orgId, projectId),
    sessions: ROUTES.org.sessions(orgId, projectId),
    documents: ROUTES.org.projectDocuments(orgId, projectId),
  })

  const sectionFilterOptions = useMemo(
    () => [
      { value: '__all__', label: 'All sections' },
      { value: UNSECTIONED_SECTION_KEY, label: 'Unsectioned' },
      ...sections.map((s) => ({ value: s.id, label: s.title })),
    ],
    [sections]
  )

  const moveDocumentItem = useMemo(() => {
    if (!moveDocumentId || !grouped) return null
    const all = [
      ...grouped.pinned,
      ...grouped.unsectioned,
      ...grouped.sections.flatMap((g) => g.documents),
    ]
    return all.find((d) => d.document_id === moveDocumentId) ?? null
  }, [moveDocumentId, grouped])

  const handleCreateSuccess = (documentId: string) => {
    setCreateOpen(false)
    setCreateSectionId(null)
    router.push(ROUTES.org.document(orgId, documentId, projectId))
  }

  const openCreateInSection = (sectionId: string | null) => {
    setCreateSectionId(sectionId)
    setCreateOpen(true)
  }

  const openAttachInSection = (sectionId: string | null) => {
    setAttachSectionId(sectionId)
    setAttachOpen(true)
  }

  const handlePinToggle = async (documentId: string, pinned: boolean) => {
    setPinLoading(documentId)
    try {
      await projectDocumentsApi.pinProjectDocument(orgId, projectId, documentId, pinned)
      await refetchDocs()
      toast.success(pinned ? 'Document pinned' : 'Document unpinned')
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to update pin'
      toast.error(msg)
    } finally {
      setPinLoading(null)
    }
  }

  const handleDetach = async () => {
    if (!detachTarget) return
    try {
      await projectDocumentsApi.detachDocumentFromProject(orgId, projectId, detachTarget)
      toast.success('Document detached from project')
      setDetachTarget(null)
      await refetchDocs()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to detach'
      toast.error(msg)
    }
  }

  const handleCreateSection = async (values: { title: string; description: string | null }) => {
    await projectDocumentsApi.createProjectSection(orgId, projectId, values)
    toast.success('Section created')
    await refetchDocs()
  }

  const handleRenameSection = async (values: { title: string; description: string | null }) => {
    if (!editingSection) return
    await projectDocumentsApi.updateProjectSection(orgId, projectId, editingSection.id, values)
    toast.success('Section updated')
    await refetchDocs()
  }

  const handleArchiveSection = async () => {
    if (!archiveSectionTarget) return
    setActionLoading(true)
    try {
      await projectDocumentsApi.archiveProjectSection(orgId, projectId, archiveSectionTarget.id)
      toast.success('Section archived')
      setArchiveSectionTarget(null)
      await refetchDocs()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to archive section'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateDefaults = async () => {
    setActionLoading(true)
    try {
      await projectDocumentsApi.createDefaultProjectSections(orgId, projectId)
      toast.success('Default sections created')
      await refetchDocs()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to create sections'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const ids = sections.map((s) => s.id)
    ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
    await projectDocumentsApi.reorderProjectSections(orgId, projectId, ids)
    await refetchDocs()
  }

  const handleMoveDocumentInList = async (
    docs: typeof grouped extends GroupedProjectDocuments | null
      ? GroupedProjectDocuments['unsectioned']
      : never,
    index: number,
    direction: 'up' | 'down',
    sectionId: string | null
  ) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= docs.length) return
    const ids = docs.map((d) => d.document_id)
    ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
    await projectDocumentsApi.reorderDocumentsInSection(orgId, projectId, sectionId, ids)
    await refetchDocs()
  }

  const handleExportHandoff = async () => {
    setHandoffExportLoading(true)
    try {
      await projectDocumentsApi.exportProjectHandoffPackage(orgId, projectId)
      toast.success('Handoff package exported')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export handoff package'
      toast.error(msg)
    } finally {
      setHandoffExportLoading(false)
    }
  }

  const hasContent = grouped && (grouped.total > 0 || sections.length > 0)

  const showPinned = !pinnedOnly && grouped && grouped.pinned.length > 0 && !sectionFilter
  const showSections =
    grouped &&
    (!sectionFilter ||
      sectionFilter === '__all__' ||
      (sectionFilter !== UNSECTIONED_SECTION_KEY && sectionFilter))
  const showUnsectioned =
    grouped &&
    grouped.unsectioned.length > 0 &&
    (!sectionFilter || sectionFilter === UNSECTIONED_SECTION_KEY)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  if (!project) {
    return <Typography tone="error">Project not found</Typography>
  }

  return (
    <div>
      <ProjectStepIndicator
        title={project.name}
        description="Documents Space"
        badges={
          <Badge
            className="rounded-none"
            variant="solid"
            tone={projectRole === 'editor' ? 'info' : 'neutral'}
            size="sm"
          >
            {projectRole}
          </Badge>
        }
        steps={flowSteps}
        rightContent={
          canManageDocuments ||
          aiPerms.canGenerateProjectBrief ||
          aiPerms.canSummarizeProjectDocuments ||
          docPerms.canExportDocuments ? (
            <div className="flex flex-wrap gap-2">
              <ProjectAIActionsMenu orgId={orgId} projectId={projectId} permissions={aiPerms} />
              {docPerms.canExportDocuments && (
                <Button
                  variant="outline"
                  size="sm"
                  loading={handoffExportLoading}
                  onClick={() => void handleExportHandoff()}
                  className="flex items-center gap-2"
                >
                  <Download size={16} aria-hidden />
                  Export handoff
                </Button>
              )}
              {canManageDocuments && docPerms.canAttachDocument && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAttachInSection(null)}
                  className="flex items-center gap-2"
                >
                  <Link2 size={16} aria-hidden />
                  Attach existing
                </Button>
              )}
              {docPerms.canCreateDocument && docPerms.canCreateFromTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeliverableOpen(true)}
                  className="flex items-center gap-2"
                >
                  <FileOutput size={16} aria-hidden />
                  Create deliverable
                </Button>
              )}
              {docPerms.canCreateDocument && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openCreateInSection(null)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} aria-hidden />
                  New document
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="mb-6">
        <Typography as="h2" weight="semibold" className="text-neutral-900">
          Documents Space
        </Typography>
        <Typography variant="small" tone="muted" className="mt-0.5">
          Organize project notes, decisions, research, and summaries.
        </Typography>
      </div>

      <div className="mb-8 space-y-3">
        <Typography as="h3" weight="semibold" className="text-neutral-900">
          Generated deliverables
        </Typography>
        <DeliverableHistoryPanel
          orgId={orgId}
          projectId={projectId}
          canExport={docPerms.canExportDocuments}
        />
      </div>

      {canManageSections && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSectionFormMode('create')
              setEditingSection(null)
              setSectionFormOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <FolderPlus size={16} aria-hidden />
            New section
          </Button>
          {sections.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={actionLoading}
              onClick={() => void handleCreateDefaults()}
              className="flex items-center gap-2"
            >
              <LayoutTemplate size={16} aria-hidden />
              Create default sections
            </Button>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size={16}
            aria-hidden
          />
          <Input
            aria-label="Search documents"
            placeholder="Search by title or content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            fullWidth
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={typeFilter || '__all__'}
            onValueChange={(v: string) => setTypeFilter(v === '__all__' ? '' : (v as DocumentType))}
            options={[
              { value: '__all__', label: 'All types' },
              ...DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-full sm:w-36">
          <Select
            value={statusFilter}
            onValueChange={(v: string) => setStatusFilter(v as 'active' | 'archived')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            value={workflowFilter || '__all__'}
            onValueChange={(v: string) =>
              setWorkflowFilter(v === '__all__' ? '' : (v as DocumentWorkflowStatus))
            }
            options={[
              { value: '__all__', label: 'All workflow' },
              ...DOCUMENT_WORKFLOW_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={sectionFilter || '__all__'}
            onValueChange={(v: string) => setSectionFilter(v === '__all__' ? '' : v)}
            options={sectionFilterOptions}
          />
        </div>
        <Button
          variant={pinnedOnly ? 'primary' : 'outline'}
          size="md"
          onClick={() => setPinnedOnly((p) => !p)}
          aria-pressed={pinnedOnly}
        >
          Pinned only
        </Button>
      </div>

      {!hasContent ? (
        <EmptyDocumentsState
          canCreate={docPerms.canCreateDocument}
          onCreate={() => openCreateInSection(null)}
        />
      ) : grouped ? (
        <div className="space-y-8">
          {!pinnedOnly && showPinned && grouped && (
            <ProjectSectionGroup
              orgId={orgId}
              projectId={projectId}
              title="Pinned"
              documents={grouped.pinned}
              canManage={canManageDocuments}
              onPinToggle={handlePinToggle}
              onDetach={setDetachTarget}
              onMoveDocument={canManageDocuments ? setMoveDocumentId : undefined}
              pinLoading={pinLoading}
            />
          )}

          {showSections &&
            grouped &&
            grouped.sections
              .filter(
                (group) =>
                  !sectionFilter ||
                  sectionFilter === '__all__' ||
                  group.section.id === sectionFilter
              )
              .map((group, index) => (
                <ProjectSectionGroup
                  key={group.section.id}
                  orgId={orgId}
                  projectId={projectId}
                  title={group.section.title}
                  description={group.section.description}
                  documents={group.documents}
                  canManage={canManageDocuments}
                  section={group.section}
                  onRename={() => {
                    setSectionFormMode('rename')
                    setEditingSection(group.section)
                    setSectionFormOpen(true)
                  }}
                  onArchive={() => setArchiveSectionTarget(group.section)}
                  onNewDocument={() => openCreateInSection(group.section.id)}
                  onMoveUp={
                    canManageDocuments ? () => void handleMoveSection(index, 'up') : undefined
                  }
                  onMoveDown={
                    canManageDocuments ? () => void handleMoveSection(index, 'down') : undefined
                  }
                  canMoveUp={index > 0}
                  canMoveDown={index < grouped.sections.length - 1}
                  onPinToggle={handlePinToggle}
                  onDetach={setDetachTarget}
                  onMoveDocument={canManageDocuments ? setMoveDocumentId : undefined}
                  onMoveDocumentUp={
                    canManageDocuments
                      ? (docId) => {
                          const idx = group.documents.findIndex((d) => d.document_id === docId)
                          if (idx >= 0)
                            void handleMoveDocumentInList(
                              group.documents,
                              idx,
                              'up',
                              group.section.id
                            )
                        }
                      : undefined
                  }
                  onMoveDocumentDown={
                    canManageDocuments
                      ? (docId) => {
                          const idx = group.documents.findIndex((d) => d.document_id === docId)
                          if (idx >= 0)
                            void handleMoveDocumentInList(
                              group.documents,
                              idx,
                              'down',
                              group.section.id
                            )
                        }
                      : undefined
                  }
                  pinLoading={pinLoading}
                />
              ))}

          {showUnsectioned && grouped && (
            <ProjectSectionGroup
              orgId={orgId}
              projectId={projectId}
              title="Unsectioned"
              documents={grouped.unsectioned}
              canManage={canManageDocuments}
              onNewDocument={() => openCreateInSection(null)}
              onPinToggle={handlePinToggle}
              onDetach={setDetachTarget}
              onMoveDocument={canManageDocuments ? setMoveDocumentId : undefined}
              onMoveDocumentUp={
                canManageDocuments
                  ? (docId) => {
                      const idx = grouped.unsectioned.findIndex((d) => d.document_id === docId)
                      if (idx >= 0)
                        void handleMoveDocumentInList(grouped.unsectioned, idx, 'up', null)
                    }
                  : undefined
              }
              onMoveDocumentDown={
                canManageDocuments
                  ? (docId) => {
                      const idx = grouped.unsectioned.findIndex((d) => d.document_id === docId)
                      if (idx >= 0)
                        void handleMoveDocumentInList(grouped.unsectioned, idx, 'down', null)
                    }
                  : undefined
              }
              pinLoading={pinLoading}
            />
          )}
        </div>
      ) : null}

      <CreateDeliverableDialog
        orgId={orgId}
        projectId={projectId}
        open={deliverableOpen}
        onClose={() => setDeliverableOpen(false)}
        onSuccess={handleCreateSuccess}
        entryContext="project_documents"
      />

      <CreateDocumentModal
        orgId={orgId}
        projectId={projectId}
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setCreateSectionId(null)
        }}
        onSuccess={handleCreateSuccess}
        sectionId={createSectionId}
        canCreateFromTemplate={docPerms.canCreateFromTemplate}
      />

      <AttachDocumentModal
        orgId={orgId}
        projectId={projectId}
        open={attachOpen}
        onClose={() => {
          setAttachOpen(false)
          setAttachSectionId(null)
        }}
        onSuccess={refetchDocs}
        sectionId={attachSectionId}
      />

      <SectionFormDialog
        open={sectionFormOpen}
        onClose={() => setSectionFormOpen(false)}
        mode={sectionFormMode}
        section={editingSection}
        onSubmit={sectionFormMode === 'create' ? handleCreateSection : handleRenameSection}
      />

      <MoveDocumentToSectionDialog
        open={!!moveDocumentId}
        onClose={() => setMoveDocumentId(null)}
        sections={sections}
        documentTitle={moveDocumentItem?.title}
        currentSectionId={moveDocumentItem?.section_id}
        onMove={async (sectionId) => {
          if (!moveDocumentId) return
          await projectDocumentsApi.moveDocumentToSection(
            orgId,
            projectId,
            moveDocumentId,
            sectionId
          )
          await refetchDocs()
        }}
      />

      <ConfirmDialog
        open={!!detachTarget}
        onClose={() => setDetachTarget(null)}
        onConfirm={handleDetach}
        title="Detach document"
        message="Remove this document from the project? The document will remain in your workspace."
        confirmLabel="Detach"
        variant="default"
      />

      <ConfirmDialog
        open={!!archiveSectionTarget}
        onClose={() => setArchiveSectionTarget(null)}
        onConfirm={handleArchiveSection}
        title="Archive section"
        message={`Archive "${archiveSectionTarget?.title}"? Documents will move to Unsectioned.`}
        confirmLabel="Archive"
        variant="default"
        loading={actionLoading}
      />
    </div>
  )
}
