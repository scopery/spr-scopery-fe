'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import {
  Typography,
  Button,
  Input,
  Textarea,
  PageSkeleton,
  Stack,
  Badge,
  Modal,
  ConfirmDialog,
  Select,
} from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { useWorkspaceMembers } from '@/modules/org/workspace/hooks/useWorkspaceMembers'
import { useProject } from '../hooks/useProject'
import { useProjectLifecycle } from '../hooks/useProjectLifecycle'
import * as projectsApi from '../api/projects.api'
import { useProjectPhases } from '../../phase/presentation/hooks/useProjectPhases'
import { PhaseBulkAddModal } from '../../phase/presentation/ui/PhaseBulkAddModal'
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

  const { session, profile } = useAuth()
  const currentUserId = session?.user?.id ?? profile?.user_id ?? ''
  const currentUserLabel =
    profile?.display_name ||
    session?.user?.fullName ||
    session?.user?.email ||
    session?.user?.username ||
    'You'
  const { members } = useWorkspaceMembers(workspaceId)

  const { project, loading, error, refetch } = useProject(workspaceId, projectId)
  const memberUserIds = useMemo(
    () => [...members.map((m) => m.userId), project?.ownerUserId],
    [members, project?.ownerUserId]
  )
  const { labelFor, peopleById } = useResolveUsers(memberUserIds)
  const { actingId, runLifecycle } = useProjectLifecycle(() => {
    void refetch()
  })
  const {
    phases,
    loading: phasesLoading,
    createPhase,
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

  const ownerOptions = useMemo(() => {
    const active = members.filter((m) => isActiveMember(m.status))
    const seen = new Set<string>()
    const options: { value: string; label: string }[] = [{ value: '', label: 'No owner' }]

    if (currentUserId) {
      seen.add(currentUserId)
      options.push({ value: currentUserId, label: `You — ${currentUserLabel}` })
    }

    if (project?.ownerUserId && !seen.has(project.ownerUserId)) {
      seen.add(project.ownerUserId)
      options.push({
        value: project.ownerUserId,
        label: labelFor(project.ownerUserId, { currentUserId, youLabel: currentUserLabel }),
      })
    }

    for (const m of active) {
      if (seen.has(m.userId)) continue
      seen.add(m.userId)
      options.push({
        value: m.userId,
        label: labelFor(m.userId, { currentUserId, youLabel: currentUserLabel }),
      })
    }

    return options
  }, [members, currentUserId, currentUserLabel, project?.ownerUserId, labelFor])

  const ownerLabel = useMemo(() => {
    if (!project?.ownerUserId) return '—'
    return labelFor(project.ownerUserId, { currentUserId, youLabel: currentUserLabel })
  }, [project?.ownerUserId, labelFor, currentUserId, currentUserLabel])

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
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={{ id: projectId, name: project.name }}
        className="mb-4"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Stack direction="horizontal" spacing="sm" className="mb-2 items-center">
            <Typography as="h1" size="lg" weight="semibold">
              Project settings
            </Typography>
            <ProjectStatusBadge status={project.status} />
          </Stack>
          <Typography variant="small" tone="muted">
            {project.code}
          </Typography>
        </div>
        <ProjectLifecycleMenu
          status={project.status}
          loading={actingId === project.id}
          onAction={async (action) => {
            await runLifecycle(project.id, action)
          }}
        />
      </div>

      <section className="mb-8 max-w-2xl border border-neutral-200 bg-white p-5">
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
                ownerLabel
              )
            }
          />
          <MetaRow label="Currency" value={project.defaultCurrency?.trim() || '—'} />
          <MetaRow
            label="Planned dates"
            value={`${formatDate(project.plannedStartDate)} → ${formatDate(project.plannedEndDate)}`}
          />
        </Stack>
      </section>

      <section className="mb-8 border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Typography as="h2" weight="semibold">
            Phases
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={14} />}
            onClick={() => setPhaseModalOpen(true)}
          >
            Add phases
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Start</th>
                <th className="px-3 py-2 font-medium">End</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {phases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-neutral-500">
                    No phases yet
                  </td>
                </tr>
              ) : (
                phases
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((ph) => (
                    <tr key={ph.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2 font-mono text-xs">{ph.code}</td>
                      <td className="px-3 py-2">{ph.name}</td>
                      <td className="max-w-xs px-3 py-2 text-neutral-600">
                        {ph.description?.trim() ? ph.description : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {formatDate(ph.plannedStartDate)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {formatDate(ph.plannedEndDate)}
                      </td>
                      <td className="px-3 py-2">{ph.displayOrder}</td>
                      <td className="px-3 py-2">
                        <Badge tone="neutral">{phaseStatusLabel(ph.status)}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Pencil size={14} />}
                            onClick={() => openEditPhase(ph)}
                            aria-label={`Edit phase ${ph.code}`}
                          >
                            Edit
                          </Button>
                          {allowedPhaseLifecycleActions(ph.status).map((action) => (
                            <Button
                              key={action}
                              size="sm"
                              variant="ghost"
                              disabled={phaseActingId === ph.id}
                              onClick={() => setPendingPhaseAction({ phaseId: ph.id, action })}
                            >
                              {action}
                            </Button>
                          ))}
                        </Stack>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>

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
          <div>
            <Typography variant="small" className="mb-1.5">
              Owner
            </Typography>
            <Select
              value={ownerUserId}
              onValueChange={setOwnerUserId}
              options={ownerOptions}
              placeholder="Select owner"
            />
          </div>
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
        onCreate={async (payload) => {
          await createPhase(payload, { refresh: false })
        }}
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
