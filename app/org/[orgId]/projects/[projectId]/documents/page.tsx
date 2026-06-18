'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Link2, Search, FolderPlus, LayoutTemplate, Download, FileOutput } from 'lucide-react'
import { Typography, Button, Badge, ContentLoader, Input, Select } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as documentsService from '@/services/documents.service'
import * as projectSectionsService from '@/services/project-sections.service'
import * as documentExportService from '@/services/document-export.service'
import { useProject } from '@/hooks/useProject'
import { useOrg } from '@/hooks/useOrg'
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions'
import { useProjectDocuments } from '@/hooks/useProjectDocuments'
import {
  buildDocumentSpacePermissions,
  buildAIPermissions,
  canManageProjectContentFallback,
  resolveProjectRole,
} from '@/utils/permissions'
import { ProjectAIActionsMenu } from '@/shared/components/ai-document-intelligence/ProjectAIActionsMenu'
import {
  ProjectStepIndicator,
  buildProjectFlowSteps,
  PROJECT_FLOW_STEP_IDS,
} from '../_components/ProjectStepIndicator'
import { CreateDocumentModal } from '@/shared/components/documents/CreateDocumentModal'
import { CreateDeliverableDialog } from '@/shared/components/documents/CreateDeliverableDialog'
import { DeliverableHistoryPanel } from '@/shared/components/documents/DeliverableHistoryPanel'
import { AttachDocumentModal } from '@/shared/components/documents/AttachDocumentModal'
import { EmptyDocumentsState } from '@/shared/components/documents/EmptyDocumentsState'
import { ProjectSectionGroup } from '@/shared/components/documents/project-sections/ProjectSectionGroup'
import { SectionFormDialog } from '@/shared/components/documents/project-sections/SectionFormDialog'
import { MoveDocumentToSectionDialog } from '@/shared/components/documents/project-sections/MoveDocumentToSectionDialog'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_WORKFLOW_STATUS_OPTIONS,
  type DocumentType,
  type DocumentWorkflowStatus,
} from '@/types/document'
import { UNSECTIONED_SECTION_KEY } from '@/types/project-section'
import type { GroupedProjectDocuments, ProjectSection } from '@/types/project-section'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

export default function ProjectDocumentsPage() {
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

  const { grouped, sections, loading: docsLoading, refetch: refetchDocs } = useProjectDocuments(
    orgId,
    projectId,
    {
      q: debouncedSearch,
      document_type: typeFilter,
      status: statusFilter,
      workflow_status: workflowFilter,
      section_id: sectionFilter,
      pinned_only: pinnedOnly,
    }
  )
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
      await documentsService.pinProjectDocument(orgId, projectId, documentId, pinned)
      await refetchDocs()
      toast.success(pinned ? 'Document pinned' : 'Document unpinned')
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to update pin'
      toast.error(msg)
    } finally {
      setPinLoading(null)
    }
  }

  const handleDetach = async () => {
    if (!detachTarget) return
    try {
      await documentsService.detachDocumentFromProject(orgId, projectId, detachTarget)
      toast.success('Document detached from project')
      setDetachTarget(null)
      await refetchDocs()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to detach'
      toast.error(msg)
    }
  }

  const handleCreateSection = async (values: { title: string; description: string | null }) => {
    await projectSectionsService.createProjectSection(orgId, projectId, values)
    toast.success('Section created')
    await refetchDocs()
  }

  const handleRenameSection = async (values: { title: string; description: string | null }) => {
    if (!editingSection) return
    await projectSectionsService.updateProjectSection(orgId, projectId, editingSection.id, values)
    toast.success('Section updated')
    await refetchDocs()
  }

  const handleArchiveSection = async () => {
    if (!archiveSectionTarget) return
    setActionLoading(true)
    try {
      await projectSectionsService.archiveProjectSection(orgId, projectId, archiveSectionTarget.id)
      toast.success('Section archived')
      setArchiveSectionTarget(null)
      await refetchDocs()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to archive section'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateDefaults = async () => {
    setActionLoading(true)
    try {
      await projectSectionsService.createDefaultProjectSections(orgId, projectId)
      toast.success('Default sections created')
      await refetchDocs()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to create sections'
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
    await projectSectionsService.reorderProjectSections(orgId, projectId, ids)
    await refetchDocs()
  }

  const handleMoveDocumentInList = async (
    docs: typeof grouped extends GroupedProjectDocuments | null ? GroupedProjectDocuments['unsectioned'] : never,
    index: number,
    direction: 'up' | 'down',
    sectionId: string | null
  ) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= docs.length) return
    const ids = docs.map((d) => d.document_id)
    ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
    await projectSectionsService.reorderDocumentsInSection(orgId, projectId, sectionId, ids)
    await refetchDocs()
  }

  const handleExportHandoff = async () => {
    setHandoffExportLoading(true)
    try {
      await documentExportService.exportProjectHandoffPackage(orgId, projectId, {
        include_requirements_list: true,
        include_evidence_index: true,
        package_format: 'zip',
      })
      toast.success('Handoff package exported')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export handoff package'
      toast.error(msg)
    } finally {
      setHandoffExportLoading(false)
    }
  }

  const hasContent =
    grouped && (grouped.total > 0 || sections.length > 0)

  const showPinned = !pinnedOnly && grouped && grouped.pinned.length > 0 && !sectionFilter
  const showSections =
    grouped &&
    (!sectionFilter || sectionFilter === '__all__' || (sectionFilter !== UNSECTIONED_SECTION_KEY && sectionFilter))
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
          <Badge className="rounded-none" variant="solid" tone={projectRole === 'editor' ? 'info' : 'neutral'} size="sm">
            {projectRole}
          </Badge>
        }
        steps={flowSteps}
        rightContent={
          canManageDocuments || aiPerms.canGenerateProjectBrief || aiPerms.canSummarizeProjectDocuments || docPerms.canExportDocuments ? (
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
                <Button variant="outline" size="sm" onClick={() => openAttachInSection(null)} className="flex items-center gap-2">
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
                <Button variant="primary" size="sm" onClick={() => openCreateInSection(null)} className="flex items-center gap-2">
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
        <div className="flex flex-wrap gap-2 mb-4">
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} aria-hidden />
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
            options={[{ value: '__all__', label: 'All types' }, ...DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]}
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
        <EmptyDocumentsState canCreate={docPerms.canCreateDocument} onCreate={() => openCreateInSection(null)} />
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
              .filter((group) => !sectionFilter || sectionFilter === '__all__' || group.section.id === sectionFilter)
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
              onMoveUp={canManageDocuments ? () => void handleMoveSection(index, 'up') : undefined}
              onMoveDown={canManageDocuments ? () => void handleMoveSection(index, 'down') : undefined}
              canMoveUp={index > 0}
              canMoveDown={index < grouped.sections.length - 1}
              onPinToggle={handlePinToggle}
              onDetach={setDetachTarget}
              onMoveDocument={canManageDocuments ? setMoveDocumentId : undefined}
              onMoveDocumentUp={
                canManageDocuments
                  ? (docId) => {
                      const idx = group.documents.findIndex((d) => d.document_id === docId)
                      if (idx >= 0) void handleMoveDocumentInList(group.documents, idx, 'up', group.section.id)
                    }
                  : undefined
              }
              onMoveDocumentDown={
                canManageDocuments
                  ? (docId) => {
                      const idx = group.documents.findIndex((d) => d.document_id === docId)
                      if (idx >= 0) void handleMoveDocumentInList(group.documents, idx, 'down', group.section.id)
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
                        if (idx >= 0) void handleMoveDocumentInList(grouped.unsectioned, idx, 'up', null)
                      }
                    : undefined
                }
                onMoveDocumentDown={
                  canManageDocuments
                    ? (docId) => {
                        const idx = grouped.unsectioned.findIndex((d) => d.document_id === docId)
                        if (idx >= 0) void handleMoveDocumentInList(grouped.unsectioned, idx, 'down', null)
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
          await projectSectionsService.moveDocumentToSection(orgId, projectId, moveDocumentId, sectionId)
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
