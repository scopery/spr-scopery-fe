'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import NextLink from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import {
  Typography,
  Button,
  Input,
  Textarea,
  PageSkeleton,
  Stack,
  Badge,
  Card,
  Modal,
  ConfirmDialog,
  DataTable,
} from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import {
  UserIdentity,
  UserSearchSelect,
  useResolveUsers,
  type PersonIdentity,
} from '@/modules/platform'
import { useWorkspaceMembers } from '@/modules/org/workspace'
import { ROUTES } from '@/constants/routes'
import { useProject } from '../hooks/useProject'
import { useProjectLifecycle } from '../hooks/useProjectLifecycle'
import * as projectsApi from '../api/projects.api'
import { useProjectPhases } from '../../phase/presentation/hooks/useProjectPhases'
import { PhaseBulkAddModal } from '../../phase/presentation/ui/PhaseBulkAddModal'
import { PhaseJsonImportModal } from '../../phase/presentation/ui/PhaseJsonImportModal'
import { ProjectStatusBadge } from '../presentation/ui/ProjectStatusBadge'
import { ProjectLifecycleMenu } from '../presentation/ui/ProjectLifecycleMenu'
import {
  allowedPhaseLifecycleActions,
  phaseStatusLabel,
  type PhaseLifecycleAction,
} from '../../phase/domain/rules/phase.rules'
import type { ProjectDetail } from '../model/project'
import type { ProjectPhase } from '../../phase/domain/model/phase'

function isActiveMember(status: string): boolean {
  return status.toUpperCase() === 'ACTIVE'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <Typography variant="small" tone="muted" className="pt-0.5">
        {label}
      </Typography>
      <div className="min-w-0 break-words text-neutral-900">{value}</div>
    </div>
  )
}

export function ProjectSettingsView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { members } = useWorkspaceMembers(workspaceId)

  const { project, loading, error, refetch } = useProject(workspaceId, projectId)
  const memberUserIds = useMemo(
    () => [...members.map((m) => m.userId), project?.ownerUserId],
    [members, project?.ownerUserId]
  )
  const { peopleById, personFor } = useResolveUsers(memberUserIds)
  const ownerPeople = useMemo(
    () =>
      members
        .filter((member) => isActiveMember(member.status))
        .map((member) => personFor(member.userId))
        .filter((person): person is PersonIdentity => Boolean(person)),
    [members, personFor]
  )
  const { actingId, runLifecycle } = useProjectLifecycle(() => {
    void refetch()
  })
  const {
    phases,
    loading: phasesLoading,
    submitPhasesBulk,
    updatePhase,
    runLifecycle: runPhaseLifecycle,
    actingId: phaseActingId,
    refetch: refetchPhases,
  } = useProjectPhases(projectId)

  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [currency, setCurrency] = useState('')
  const [plannedStart, setPlannedStart] = useState('')
  const [plannedEnd, setPlannedEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [phaseModalOpen, setPhaseModalOpen] = useState(false)
  const [phaseJsonOpen, setPhaseJsonOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null)
  const [editPhaseName, setEditPhaseName] = useState('')
  const [editPhaseDescription, setEditPhaseDescription] = useState('')
  const [editPhaseOrder, setEditPhaseOrder] = useState('')
  const [editPhaseStart, setEditPhaseStart] = useState('')
  const [editPhaseEnd, setEditPhaseEnd] = useState('')
  const [phaseSaving, setPhaseSaving] = useState(false)
  const [pendingPhaseAction, setPendingPhaseAction] = useState<{
    phaseId: string
    action: PhaseLifecycleAction
  } | null>(null)

  const nextPhaseOrder = useMemo(() => {
    if (phases.length === 0) return 1
    return Math.max(...phases.map((p) => p.displayOrder)) + 1
  }, [phases])

  const openEditModal = (p: ProjectDetail) => {
    setName(p.name)
    setDescription(p.description ?? '')
    setOwnerUserId(p.ownerUserId ?? '')
    setCurrency(p.defaultCurrency ?? '')
    setPlannedStart(p.plannedStartDate ?? '')
    setPlannedEnd(p.plannedEndDate ?? '')
    setEditOpen(true)
  }

  if (loading || phasesLoading) return <PageSkeleton variant="detail" />
  if (error || !project) {
    return <Typography tone="error">{error ?? 'Project not found'}</Typography>
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await projectsApi.updateProject(projectId, {
        name: name.trim(),
        description: description.trim() || null,
        ownerUserId: ownerUserId.trim() || null,
        defaultCurrency: currency.trim() || null,
        plannedStartDate: plannedStart || null,
        plannedEndDate: plannedEnd || null,
      })
      toast.success('Project updated')
      setEditOpen(false)
      await refetch()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const openEditPhase = (ph: ProjectPhase) => {
    setEditingPhase(ph)
    setEditPhaseName(ph.name)
    setEditPhaseDescription(ph.description ?? '')
    setEditPhaseOrder(String(ph.displayOrder))
    setEditPhaseStart(ph.plannedStartDate ?? '')
    setEditPhaseEnd(ph.plannedEndDate ?? '')
  }

  const handleUpdatePhase = async () => {
    if (!editingPhase) return
    const nm = editPhaseName.trim()
    if (!nm) return
    const order = Number.parseInt(editPhaseOrder, 10)
    setPhaseSaving(true)
    try {
      await updatePhase(editingPhase.id, {
        name: nm,
        description: editPhaseDescription.trim() || null,
        displayOrder: Number.isFinite(order) ? order : editingPhase.displayOrder,
        plannedStartDate: editPhaseStart || null,
        plannedEndDate: editPhaseEnd || null,
      })
      toast.success('Phase updated')
      setEditingPhase(null)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setPhaseSaving(false)
    }
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={{ id: projectId, name: project.name }}
        className="mb-1"
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Stack direction="horizontal" spacing="sm" className="mb-2 items-center">
            <Typography as="h1" size="md" weight="medium">
              Project settings
            </Typography>
            <ProjectStatusBadge status={project.status} />
          </Stack>
          <Typography variant="small" tone="muted">
            {project.code}
          </Typography>
          <NextLink
            href={ROUTES.workspace.projectMemberPermissions(workspaceId, projectId)}
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Manage member permissions
          </NextLink>
        </div>
        <ProjectLifecycleMenu
          status={project.status}
          loading={actingId === project.id}
          onAction={async (action) => {
            await runLifecycle(project.id, action)
          }}
        />
      </div>

      <Card as="section" className="mb-8 max-w-2xl p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <Typography as="h2" weight="semibold">
            Project details
          </Typography>
          <Button
            size="sm"
            variant="ghost"
            icon={<Pencil size={14} />}
            onClick={() => openEditModal(project)}
            aria-label="Edit project details"
          >
            Edit
          </Button>
        </div>
        <Stack direction="vertical" spacing="md">
          <MetaRow label="Name" value={project.name} />
          <MetaRow
            label="Description"
            value={project.description?.trim() ? project.description : '—'}
          />
          <MetaRow
            label="Owner"
            value={
              project.ownerUserId ? (
                <UserIdentity
                  userId={project.ownerUserId}
                  person={peopleById[project.ownerUserId]}
                  size="sm"
                  showEmail
                />
              ) : (
                '—'
              )
            }
          />
          <MetaRow label="Currency" value={project.defaultCurrency?.trim() || '—'} />
          <MetaRow
            label="Planned dates"
            value={`${formatDate(project.plannedStartDate)} → ${formatDate(project.plannedEndDate)}`}
          />
        </Stack>
      </Card>

      <Card as="section" className="mb-8 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Typography as="h2" weight="semibold">
            Phases
          </Typography>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={14} />}
              onClick={() => setPhaseModalOpen(true)}
            >
              Bulk add
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPhaseJsonOpen(true)}>
              JSON import
            </Button>
          </div>
        </div>
        <DataTable
          ariaLabel="Project phases"
          rows={phases.slice().sort((a, b) => a.displayOrder - b.displayOrder)}
          rowKey={(phase) => phase.id}
          emptyMessage="No phases yet"
          columns={[
            { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
            { id: 'name', header: 'Name', accessor: 'name' },
            {
              id: 'description',
              header: 'Description',
              accessor: (phase) => phase.description?.trim() || '—',
            },
            {
              id: 'start',
              header: 'Start',
              accessor: (phase) => formatDate(phase.plannedStartDate),
            },
            { id: 'end', header: 'End', accessor: (phase) => formatDate(phase.plannedEndDate) },
            { id: 'order', header: 'Order', accessor: 'displayOrder' },
            {
              id: 'status',
              header: 'Status',
              cell: (phase) => <Badge tone="neutral">{phaseStatusLabel(phase.status)}</Badge>,
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (phase) => (
                <Stack direction="horizontal" spacing="sm" className="flex-wrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Pencil size={14} />}
                    onClick={() => openEditPhase(phase)}
                    aria-label={`Edit phase ${phase.code}`}
                  >
                    Edit
                  </Button>
                  {allowedPhaseLifecycleActions(phase.status).map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant="ghost"
                      disabled={phaseActingId === phase.id}
                      onClick={() => setPendingPhaseAction({ phaseId: phase.id, action })}
                    >
                      {action}
                    </Button>
                  ))}
                </Stack>
              ),
            },
          ]}
        />
      </Card>

      <section className="border border-red-200 bg-red-50/40 p-5">
        <Typography as="h2" weight="semibold" className="mb-2">
          Dangerous lifecycle
        </Typography>
        <Typography variant="small" tone="muted" className="mb-4">
          Hold, complete, or archive this project. These actions are confirmed and not optimistic.
        </Typography>
        <ProjectLifecycleMenu
          status={project.status}
          menuPlacement="top"
          loading={actingId === project.id}
          onAction={async (action) => {
            await runLifecycle(project.id, action)
          }}
        />
      </section>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit project details"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setEditOpen(false), variant: 'ghost' },
          {
            label: 'Save changes',
            onClick: () => void handleSave(),
            variant: 'primary',
            loading: saving,
          },
        ]}
      >
        <div className="space-y-4">
          <Input label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            label="Description"
            fullWidth
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <UserSearchSelect
            label="Owner"
            value={ownerUserId}
            onChange={setOwnerUserId}
            seedPeople={ownerPeople}
            allowRemoteSearch={false}
          />
          <Input
            label="Currency"
            fullWidth
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="e.g. VND"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Planned start"
              type="date"
              fullWidth
              value={plannedStart}
              onChange={(e) => setPlannedStart(e.target.value)}
            />
            <Input
              label="Planned end"
              type="date"
              fullWidth
              value={plannedEnd}
              onChange={(e) => setPlannedEnd(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <PhaseBulkAddModal
        open={phaseModalOpen}
        nextDisplayOrder={nextPhaseOrder}
        onClose={() => setPhaseModalOpen(false)}
        onSubmitBulk={submitPhasesBulk}
        onBatchComplete={async () => {
          await refetchPhases({ silent: true })
        }}
      />

      <PhaseJsonImportModal
        open={phaseJsonOpen}
        nextDisplayOrder={nextPhaseOrder}
        onClose={() => setPhaseJsonOpen(false)}
        onSubmitBulk={submitPhasesBulk}
        onBatchComplete={async () => {
          await refetchPhases({ silent: true })
        }}
      />

      <Modal
        open={editingPhase != null}
        onClose={() => setEditingPhase(null)}
        title={editingPhase ? `Edit phase · ${editingPhase.code}` : 'Edit phase'}
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setEditingPhase(null), variant: 'ghost' },
          {
            label: 'Save',
            onClick: () => void handleUpdatePhase(),
            variant: 'primary',
            loading: phaseSaving,
          },
        ]}
      >
        <div className="space-y-3">
          <Typography variant="small" tone="muted">
            Code cannot be changed after create.
          </Typography>
          <Input
            label="Name"
            fullWidth
            value={editPhaseName}
            onChange={(e) => setEditPhaseName(e.target.value)}
          />
          <Textarea
            label="Description"
            fullWidth
            rows={3}
            value={editPhaseDescription}
            onChange={(e) => setEditPhaseDescription(e.target.value)}
          />
          <Input
            label="Display order"
            type="number"
            fullWidth
            value={editPhaseOrder}
            onChange={(e) => setEditPhaseOrder(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Planned start"
              type="date"
              fullWidth
              value={editPhaseStart}
              onChange={(e) => setEditPhaseStart(e.target.value)}
            />
            <Input
              label="Planned end"
              type="date"
              fullWidth
              value={editPhaseEnd}
              onChange={(e) => setEditPhaseEnd(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {pendingPhaseAction && (
        <ConfirmDialog
          open
          onClose={() => setPendingPhaseAction(null)}
          onConfirm={async () => {
            try {
              await runPhaseLifecycle(pendingPhaseAction.phaseId, pendingPhaseAction.action)
              toast.success('Phase updated')
              setPendingPhaseAction(null)
            } catch (err) {
              toast.error(getProblemToastMessage(err))
              throw err
            }
          }}
          title={`${pendingPhaseAction.action} phase?`}
          message="This lifecycle change cannot be reversed from the UI."
          confirmLabel={pendingPhaseAction.action}
          variant={pendingPhaseAction.action === 'archive' ? 'danger' : 'default'}
        />
      )}
    </div>
  )
}
