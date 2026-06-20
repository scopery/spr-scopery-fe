'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Typography, Badge, ContentLoader, ConfirmDialog } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useProject } from '@/modules/projects'
import { useOrg } from '@/modules/org'
import { useEffectivePermissions } from '@/modules/permissions'
import {
  buildDocumentSpacePermissions,
  buildAIPermissions,
  canManageProjectContentFallback,
  resolveProjectRole,
} from '@/modules/permissions'
import {
  ProjectStepIndicator,
  buildProjectFlowSteps,
  PROJECT_FLOW_STEP_IDS,
} from '@/modules/projects'
import {
  CreateDocumentModal,
  CreateDeliverableDialog,
  DeliverableHistoryPanel,
  AttachDocumentModal,
  SectionFormDialog,
  MoveDocumentToSectionDialog,
  useProjectDocuments,
} from '@/modules/documents'
import { type DocumentType, type DocumentWorkflowStatus } from '@/modules/documents'
import { UNSECTIONED_SECTION_KEY } from '@/modules/documents'
import type { ProjectSection } from '@/modules/documents'
import { useProjectDocumentActions } from '../hooks/useProjectDocumentActions'
import { ProjectDocumentsHeaderActions } from './ProjectDocumentsHeaderActions'
import { ProjectDocumentsFilters } from './ProjectDocumentsFilters'
import { ProjectDocumentsContent } from './ProjectDocumentsContent'

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
  const [detachTarget, setDetachTarget] = useState<string | null>(null)

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

  const actions = useProjectDocumentActions({
    orgId,
    projectId,
    sections,
    refetch: refetchDocs,
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

  const showHeaderActions =
    canManageDocuments ||
    aiPerms.canGenerateProjectBrief ||
    aiPerms.canSummarizeProjectDocuments ||
    docPerms.canExportDocuments

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
          showHeaderActions ? (
            <ProjectDocumentsHeaderActions
              orgId={orgId}
              projectId={projectId}
              canManageDocuments={canManageDocuments}
              docPerms={docPerms}
              aiPerms={aiPerms}
              handoffExportLoading={actions.handoffExportLoading}
              onExportHandoff={actions.handleExportHandoff}
              onAttach={() => openAttachInSection(null)}
              onCreateDeliverable={() => setDeliverableOpen(true)}
              onCreateDocument={() => openCreateInSection(null)}
            />
          ) : undefined
        }
      />

      <ProjectDocumentsFilters
        canManageSections={canManageSections}
        sectionsCount={sections.length}
        actionLoading={actions.actionLoading}
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        workflowFilter={workflowFilter}
        onWorkflowFilterChange={setWorkflowFilter}
        sectionFilter={sectionFilter}
        onSectionFilterChange={setSectionFilter}
        sectionFilterOptions={sectionFilterOptions}
        pinnedOnly={pinnedOnly}
        onPinnedOnlyToggle={() => setPinnedOnly((p) => !p)}
        onNewSection={() => {
          setSectionFormMode('create')
          setEditingSection(null)
          setSectionFormOpen(true)
        }}
        onCreateDefaultSections={actions.handleCreateDefaults}
      />

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

      <ProjectDocumentsContent
        orgId={orgId}
        projectId={projectId}
        grouped={grouped}
        sections={sections}
        canManageDocuments={canManageDocuments}
        canCreateDocument={docPerms.canCreateDocument}
        pinnedOnly={pinnedOnly}
        sectionFilter={sectionFilter}
        pinLoading={actions.pinLoading}
        onPinToggle={actions.handlePinToggle}
        onDetach={setDetachTarget}
        onMoveDocument={setMoveDocumentId}
        onRenameSection={(section) => {
          setSectionFormMode('rename')
          setEditingSection(section)
          setSectionFormOpen(true)
        }}
        onArchiveSection={setArchiveSectionTarget}
        onCreateInSection={openCreateInSection}
        onMoveSection={actions.handleMoveSection}
        onMoveDocumentInList={actions.handleMoveDocumentInList}
      />

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
        onSubmit={
          sectionFormMode === 'create'
            ? actions.handleCreateSection
            : (values) =>
                editingSection
                  ? actions.handleRenameSection(editingSection.id, values)
                  : Promise.resolve()
        }
      />

      <MoveDocumentToSectionDialog
        open={!!moveDocumentId}
        onClose={() => setMoveDocumentId(null)}
        sections={sections}
        documentTitle={moveDocumentItem?.title}
        currentSectionId={moveDocumentItem?.section_id}
        onMove={async (sectionId) => {
          if (!moveDocumentId) return
          await actions.handleMoveDocumentToSection(moveDocumentId, sectionId)
        }}
      />

      <ConfirmDialog
        open={!!detachTarget}
        onClose={() => setDetachTarget(null)}
        onConfirm={async () => {
          if (!detachTarget) return
          await actions.handleDetach(detachTarget)
          setDetachTarget(null)
        }}
        title="Detach document"
        message="Remove this document from the project? The document will remain in your workspace."
        confirmLabel="Detach"
        variant="default"
      />

      <ConfirmDialog
        open={!!archiveSectionTarget}
        onClose={() => setArchiveSectionTarget(null)}
        onConfirm={async () => {
          if (!archiveSectionTarget) return
          await actions.handleArchiveSection(archiveSectionTarget.id)
          setArchiveSectionTarget(null)
        }}
        title="Archive section"
        message={`Archive "${archiveSectionTarget?.title}"? Documents will move to Unsectioned.`}
        confirmLabel="Archive"
        variant="default"
        loading={actions.actionLoading}
      />
    </div>
  )
}
