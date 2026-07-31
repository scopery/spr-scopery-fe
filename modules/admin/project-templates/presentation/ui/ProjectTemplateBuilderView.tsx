'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import NextLink from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Input,
  Link as DesignLink,
  Modal,
  PageSkeleton,
  Select,
  Typography,
  DataTable, Card,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { cn } from '@/utils/cn'
import { useProjectTemplateBuilder } from '../hooks/useProjectTemplateBuilder'

const TABS = [
  { id: 'structure', label: 'Structure' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'preview', label: 'Preview' },
] as const

type TabId = (typeof TABS)[number]['id']

const DEPENDENCY_TYPE_OPTIONS = [
  { value: 'FINISH_TO_START', label: 'Finish → Start' },
  { value: 'START_TO_START', label: 'Start → Start' },
  { value: 'FINISH_TO_FINISH', label: 'Finish → Finish' },
  { value: 'START_TO_FINISH', label: 'Start → Finish' },
]

export function ProjectTemplateBuilderView() {
  const { templateId } = useParams<{ templateId: string }>()
  const [tab, setTab] = useState<TabId>('structure')

  const {
    template,
    versions,
    selectedVersionId,
    setSelectedVersionId,
    selectedVersion,
    isDraft,
    phases,
    tasks,
    dependencies,
    loading,
    detailLoading,
    error,
    createVersion,
    publishVersion,
    createPhase,
    createTask,
    createDependency,
  } = useProjectTemplateBuilder(templateId ?? null)

  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [newVersionDescription, setNewVersionDescription] = useState('')
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [phaseModalOpen, setPhaseModalOpen] = useState(false)
  const [phaseCode, setPhaseCode] = useState('')
  const [phaseName, setPhaseName] = useState('')
  const [phaseOrder, setPhaseOrder] = useState('1')
  const [phaseDuration, setPhaseDuration] = useState('')
  const [savingPhase, setSavingPhase] = useState(false)

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskCode, setTaskCode] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPhaseId, setTaskPhaseId] = useState('')
  const [taskEstimate, setTaskEstimate] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  const [depModalOpen, setDepModalOpen] = useState(false)
  const [predecessorId, setPredecessorId] = useState('')
  const [successorId, setSuccessorId] = useState('')
  const [dependencyType, setDependencyType] = useState('FINISH_TO_START')
  const [lagDays, setLagDays] = useState('0')
  const [savingDep, setSavingDep] = useState(false)

  if (loading && !template) return <PageSkeleton variant="detail" />

  const versionOptions = versions.map((v) => ({
    value: v.id,
    label: `v${v.versionNumber} — ${v.name} (${v.status})`,
  }))

  const taskById = (id: string) => tasks.find((t) => t.id === id)
  const phaseById = (id: string) => phases.find((p) => p.id === id)

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.projectTemplates}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to templates
      </NextLink>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            {template ? `${template.name} — Builder` : 'Template builder'}
          </Typography>
          {template ? (
            <Typography variant="small" tone="muted" className="mt-1 font-normal">
              {template.code}
            </Typography>
          ) : null}
        </div>
        <Button variant="secondary" onClick={() => setVersionModalOpen(true)}>
          New draft version
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Typography variant="small" className="mb-1.5">
            Version
          </Typography>
          <Select
            value={selectedVersionId ?? ''}
            onValueChange={setSelectedVersionId}
            options={
              versionOptions.length ? versionOptions : [{ value: '', label: 'No versions yet' }]
            }
          />
        </div>
        {selectedVersion ? (
          <Badge tone={isDraft ? 'warning' : 'success'}>{selectedVersion.status}</Badge>
        ) : null}
        {selectedVersion && isDraft ? (
          <Button
            size="sm"
            variant="primary"
            loading={publishing}
            onClick={() => {
              setPublishing(true)
              void publishVersion()
                .then(() => toast.success('Version published'))
                .catch((e) => toast.error(getProblemToastMessage(e)))
                .finally(() => setPublishing(false))
            }}
          >
            Publish version
          </Button>
        ) : null}
      </div>

      {selectedVersion && !isDraft ? (
        <div className="mb-4 border border-amber-200 bg-amber-50 p-3">
          <Typography variant="small" className="text-amber-800">
            This version is <strong>{selectedVersion.status}</strong> and read-only. Create a new
            draft version to make changes.
          </Typography>
        </div>
      ) : null}

      {!selectedVersion ? (
        <div className="mb-4 border border-neutral-200 bg-neutral-50 p-3">
          <Typography variant="small" tone="muted">
            No versions exist yet. Create a draft version to start building structure.
          </Typography>
        </div>
      ) : null}

      <nav
        aria-label="Builder sections"
        className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200"
      >
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-primary text-neutral-900'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              )}
            >
              {t.label}
            </button>
          )
        })}
      </nav>

      {detailLoading ? <PageSkeleton variant="list" /> : null}

      {!detailLoading && tab === 'structure' ? (
        <div>
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedVersion || !isDraft}
              onClick={() => setPhaseModalOpen(true)}
            >
              Add phase
            </Button>
          </div>
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <DataTable
              ariaLabel="Project Template Builder"
              rows={phases.slice().sort((a, b) => a.displayOrder - b.displayOrder)}
              rowKey={(p) => String(p.id)}
              emptyMessage="No items."
              columns={[
                { id: 'order', header: 'Order', accessor: 'displayOrder' },
                {
                  id: 'code',
                  header: 'Code',
                  cell: (p) => (
                    <>
                      <Typography as="span" variant="small" className="font-normal">
                        {p.code}
                      </Typography>
                    </>
                  ),
                  kind: 'code',
                },
                { id: 'name', header: 'Name', accessor: 'name' },
                {
                  id: 'duration-days-',
                  header: 'Duration (days)',
                  cell: (p) => <>{p.defaultDurationDays ?? '—'}</>,
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {!detailLoading && tab === 'tasks' ? (
        <div>
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedVersion || !isDraft || phases.length === 0}
              onClick={() => setTaskModalOpen(true)}
            >
              Add task
            </Button>
          </div>
          {phases.length === 0 && selectedVersion && isDraft ? (
            <Typography variant="small" tone="muted" className="mb-3">
              Add a phase first — tasks are attached to a phase.
            </Typography>
          ) : null}
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <DataTable
              ariaLabel="Project Template Builder"
              rows={tasks}
              rowKey={(t) => String(t.id)}
              emptyMessage="No items."
              columns={[
                {
                  id: 'code',
                  header: 'Code',
                  cell: (t) => (
                    <>
                      <Typography as="span" variant="small" className="font-normal">
                        {t.code}
                      </Typography>
                    </>
                  ),
                  kind: 'code',
                },
                { id: 'title', header: 'Title', accessor: 'title' },
                {
                  id: 'phase',
                  header: 'Phase',
                  cell: (t) => <>{phaseById(t.templatePhaseId)?.name ?? '—'}</>,
                },
                {
                  id: 'estimate-h-',
                  header: 'Estimate (h)',
                  cell: (t) => <>{t.estimateHours ?? '—'}</>,
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {!detailLoading && tab === 'dependencies' ? (
        <div>
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedVersion || !isDraft || tasks.length < 2}
              onClick={() => setDepModalOpen(true)}
            >
              Add dependency
            </Button>
          </div>
          {tasks.length < 2 && selectedVersion && isDraft ? (
            <Typography variant="small" tone="muted" className="mb-3">
              Add at least two tasks first — dependencies link a predecessor to a successor.
            </Typography>
          ) : null}
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <DataTable
              ariaLabel="Project Template Builder"
              rows={dependencies}
              rowKey={(d) => String(d.id)}
              emptyMessage="No items."
              columns={[
                {
                  id: 'predecessor',
                  header: 'Predecessor',
                  cell: (d) => <>{taskById(d.predecessorTemplateTaskId)?.title ?? '—'}</>,
                },
                {
                  id: 'successor',
                  header: 'Successor',
                  cell: (d) => <>{taskById(d.successorTemplateTaskId)?.title ?? '—'}</>,
                },
                { id: 'type', header: 'Type', accessor: 'dependencyType' },
                { id: 'lag-days-', header: 'Lag (days)', accessor: 'lagDays' },
              ]}
            />
          </div>
        </div>
      ) : null}

      {!detailLoading && tab === 'preview' ? (
        <div className="space-y-6">
          <Typography variant="small" tone="muted">
            Read-only summary of{' '}
            {selectedVersion ? `v${selectedVersion.versionNumber}` : 'this version'}.
          </Typography>
          {phases
            .slice()
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((p) => (
              <Card key={p.id} className="p-4">
                <Typography weight="semibold">
                  {p.displayOrder}. {p.name}{' '}
                  <Typography as="span" variant="small" tone="muted" className="font-normal">
                    ({p.code})
                  </Typography>
                </Typography>
                <ul className="mt-3 space-y-2">
                  {tasks
                    .filter((t) => t.templatePhaseId === p.id)
                    .map((t) => (
                      <li key={t.id} className="flex items-center justify-between">
                        <Typography as="span" variant="small">
                          {t.title}{' '}
                          <Typography
                            as="span"
                            variant="small"
                            tone="muted"
                            className="font-normal"
                          >
                            ({t.code})
                          </Typography>
                        </Typography>
                        <Typography as="span" variant="small" tone="muted">
                          {t.estimateHours ?? '—'} h
                        </Typography>
                      </li>
                    ))}
                  {tasks.filter((t) => t.templatePhaseId === p.id).length === 0 ? (
                    <li>
                      <Typography as="span" variant="small" tone="muted">
                        No tasks in this phase
                      </Typography>
                    </li>
                  ) : null}
                </ul>
              </Card>
            ))}
          {phases.length === 0 ? (
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <Typography variant="small" tone="muted">
                Nothing to preview yet.
              </Typography>
            </div>
          ) : null}
          {dependencies.length > 0 ? (
            <Card className="p-4">
              <Typography weight="semibold" className="mb-3">
                Dependencies
              </Typography>
              <ul className="space-y-1">
                {dependencies.map((d) => (
                  <li key={d.id}>
                    <Typography variant="small">
                      {taskById(d.predecessorTemplateTaskId)?.title ?? '—'} →{' '}
                      {taskById(d.successorTemplateTaskId)?.title ?? '—'} ({d.dependencyType}, lag{' '}
                      {d.lagDays}d)
                    </Typography>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        title="Create draft version"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setVersionModalOpen(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            loading: creatingVersion,
            onClick: () => {
              if (!newVersionName.trim()) return
              setCreatingVersion(true)
              void createVersion({
                name: newVersionName.trim(),
                description: newVersionDescription.trim() || undefined,
              })
                .then(() => {
                  toast.success('Draft version created')
                  setVersionModalOpen(false)
                  setNewVersionName('')
                  setNewVersionDescription('')
                })
                .catch((e) => toast.error(getProblemToastMessage(e)))
                .finally(() => setCreatingVersion(false))
            },
          },
        ]}
      >
        <div className="space-y-3">
          <Input
            label="Version name"
            fullWidth
            placeholder="v2.0"
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
          />
          <Input
            label="Description (optional)"
            fullWidth
            value={newVersionDescription}
            onChange={(e) => setNewVersionDescription(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={phaseModalOpen}
        onClose={() => setPhaseModalOpen(false)}
        title="Add phase"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setPhaseModalOpen(false), variant: 'ghost' },
          {
            label: 'Add',
            variant: 'primary',
            loading: savingPhase,
            onClick: () => {
              if (!phaseCode.trim() || !phaseName.trim()) return
              setSavingPhase(true)
              void createPhase({
                code: phaseCode.trim(),
                name: phaseName.trim(),
                displayOrder: Number(phaseOrder) || phases.length + 1,
                defaultDurationDays: phaseDuration.trim() ? Number(phaseDuration) : undefined,
              })
                .then(() => {
                  toast.success('Phase added')
                  setPhaseModalOpen(false)
                  setPhaseCode('')
                  setPhaseName('')
                  setPhaseOrder(String(phases.length + 2))
                  setPhaseDuration('')
                })
                .catch((e) => toast.error(getProblemToastMessage(e)))
                .finally(() => setSavingPhase(false))
            },
          },
        ]}
      >
        <div className="space-y-3">
          <Input
            label="Code"
            fullWidth
            value={phaseCode}
            onChange={(e) => setPhaseCode(e.target.value)}
          />
          <Input
            label="Name"
            fullWidth
            value={phaseName}
            onChange={(e) => setPhaseName(e.target.value)}
          />
          <Input
            label="Display order"
            type="number"
            fullWidth
            value={phaseOrder}
            onChange={(e) => setPhaseOrder(e.target.value)}
          />
          <Input
            label="Default duration (days)"
            type="number"
            fullWidth
            value={phaseDuration}
            onChange={(e) => setPhaseDuration(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Add task"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setTaskModalOpen(false), variant: 'ghost' },
          {
            label: 'Add',
            variant: 'primary',
            loading: savingTask,
            onClick: () => {
              if (!taskCode.trim() || !taskTitle.trim() || !taskPhaseId) return
              setSavingTask(true)
              void createTask({
                templatePhaseId: taskPhaseId,
                code: taskCode.trim(),
                title: taskTitle.trim(),
                estimateHours: taskEstimate.trim() ? Number(taskEstimate) : undefined,
              })
                .then(() => {
                  toast.success('Task added')
                  setTaskModalOpen(false)
                  setTaskCode('')
                  setTaskTitle('')
                  setTaskEstimate('')
                })
                .catch((e) => toast.error(getProblemToastMessage(e)))
                .finally(() => setSavingTask(false))
            },
          },
        ]}
      >
        <div className="space-y-3">
          <div>
            <Typography variant="small" className="mb-1.5">
              Phase
            </Typography>
            <Select
              value={taskPhaseId}
              onValueChange={setTaskPhaseId}
              options={
                phases.length
                  ? phases.map((p) => ({ value: p.id, label: p.name }))
                  : [{ value: '', label: 'No phases yet' }]
              }
            />
          </div>
          <Input
            label="Code"
            fullWidth
            value={taskCode}
            onChange={(e) => setTaskCode(e.target.value)}
          />
          <Input
            label="Title"
            fullWidth
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <Input
            label="Estimate hours"
            type="number"
            fullWidth
            value={taskEstimate}
            onChange={(e) => setTaskEstimate(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={depModalOpen}
        onClose={() => setDepModalOpen(false)}
        title="Add dependency"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setDepModalOpen(false), variant: 'ghost' },
          {
            label: 'Add',
            variant: 'primary',
            loading: savingDep,
            onClick: () => {
              if (!predecessorId || !successorId || predecessorId === successorId) return
              setSavingDep(true)
              void createDependency({
                predecessorTemplateTaskId: predecessorId,
                successorTemplateTaskId: successorId,
                dependencyType,
                lagDays: Number(lagDays) || 0,
              })
                .then(() => {
                  toast.success('Dependency added')
                  setDepModalOpen(false)
                  setPredecessorId('')
                  setSuccessorId('')
                  setLagDays('0')
                })
                .catch((e) => toast.error(getProblemToastMessage(e)))
                .finally(() => setSavingDep(false))
            },
          },
        ]}
      >
        <div className="space-y-3">
          <div>
            <Typography variant="small" className="mb-1.5">
              Predecessor task
            </Typography>
            <Select
              value={predecessorId}
              onValueChange={setPredecessorId}
              options={tasks.map((t) => ({ value: t.id, label: t.title }))}
            />
          </div>
          <div>
            <Typography variant="small" className="mb-1.5">
              Successor task
            </Typography>
            <Select
              value={successorId}
              onValueChange={setSuccessorId}
              options={tasks.map((t) => ({ value: t.id, label: t.title }))}
            />
          </div>
          <div>
            <Typography variant="small" className="mb-1.5">
              Dependency type
            </Typography>
            <Select
              value={dependencyType}
              onValueChange={setDependencyType}
              options={DEPENDENCY_TYPE_OPTIONS}
            />
          </div>
          <Input
            label="Lag (days)"
            type="number"
            fullWidth
            value={lagDays}
            onChange={(e) => setLagDays(e.target.value)}
          />
        </div>
      </Modal>

      <div className="mt-6">
        <DesignLink as={NextLink} href={ADMIN_ROUTES.projectTemplates} variant="secondary">
          ← Back to library
        </DesignLink>
      </div>
    </div>
  )
}
