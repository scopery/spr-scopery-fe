'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Input, Select, Stack, Textarea, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { UserSearchSelect, useResolveUsers, type PersonIdentity } from '@/modules/platform'
import { useWorkspaceMembers } from '@/modules/org/workspace'
import { useProjectWbs, WbsNodeStatus, type WbsTreeNode } from '@/modules/projects/wbs'
import type { ProjectPhase } from '../../../phase/domain/model/phase'
import type { ProjectTask, UpdateTaskPayload } from '../../domain/model/task'
import {
  allowedTaskLifecycleActions,
  canAssignTask,
  taskPriorityLabel,
  taskStatusLabel,
  type TaskLifecycleAction,
} from '../../domain/rules/task.rules'
import { TaskPriority, TaskStatus } from '../../../project/domain/enums/project.enum'
import { TaskDependenciesPanel } from '@/modules/projects/task-dependency'
import { TaskResourcesPanel } from '@/modules/capacity'
import { CommentThreadsPanel } from '@/modules/projects/comments'

type DrawerTab = 'details' | 'dependencies' | 'resources' | 'comments'

const ACTION_LABEL: Record<TaskLifecycleAction, string> = {
  start: 'Start',
  block: 'Block',
  complete: 'Complete',
  cancel: 'Cancel',
  archive: 'Archive',
  reopen: 'Reopen',
}

const PRIORITY_OPTIONS = [
  { value: TaskPriority.Low, label: 'Low' },
  { value: TaskPriority.Medium, label: 'Medium' },
  { value: TaskPriority.High, label: 'High' },
  { value: TaskPriority.Critical, label: 'Critical' },
]

function isActiveMember(status: string): boolean {
  return status === 'ACTIVE' || status === 'active'
}

function flattenWbsOptions(
  nodes: WbsTreeNode[],
  depth = 0,
  selectedId?: string | null
): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  for (const n of nodes) {
    const include = n.status !== WbsNodeStatus.Archived || n.id === selectedId
    if (include) {
      const prefix = depth > 0 ? `${'—'.repeat(depth)} ` : ''
      out.push({ value: n.id, label: `${prefix}${n.code} · ${n.title}` })
    }
    if (n.children.length) {
      out.push(...flattenWbsOptions(n.children, depth + 1, selectedId))
    }
  }
  return out
}

interface TaskDetailDrawerProps {
  workspaceId: string
  projectId: string
  phases: ProjectPhase[]
  task: ProjectTask | null
  open: boolean
  acting?: boolean
  onClose: () => void
  onLifecycle: (taskId: string, action: TaskLifecycleAction) => Promise<void>
  onSave: (taskId: string, body: UpdateTaskPayload) => Promise<void>
  /**
   * Optional URL to `router.replace` on close (e.g. Work Items deep-link clear).
   * Omit when embedded on Timeline / other pages so close stays on the current route.
   */
  closeHref?: string | null
}

export function TaskDetailDrawer({
  workspaceId,
  projectId,
  phases,
  task,
  open,
  acting,
  onClose,
  onLifecycle,
  onSave,
  closeHref = null,
}: TaskDetailDrawerProps) {
  const router = useRouter()

  const [tab, setTab] = useState<DrawerTab>('details')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>(TaskPriority.Medium)
  const [dueDate, setDueDate] = useState('')
  const [phaseId, setPhaseId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [wbsNodeId, setWbsNodeId] = useState('')
  const [estimateHours, setEstimateHours] = useState('')
  const [saving, setSaving] = useState(false)

  const { members } = useWorkspaceMembers(open ? workspaceId : null)
  const { tree: wbsTree } = useProjectWbs(open ? projectId : null)
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members])
  const { personFor } = useResolveUsers(memberUserIds)
  const assigneePeople = useMemo(
    () =>
      members
        .filter((member) => isActiveMember(member.status))
        .map((member) => personFor(member.userId))
        .filter((person): person is PersonIdentity => Boolean(person)),
    [members, personFor]
  )

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setPriority(task.priority || TaskPriority.Medium)
    setDueDate(task.dueDate ?? '')
    setPhaseId(task.projectPhaseId ?? '')
    setAssigneeId(task.inChargeUserId ?? '')
    setWbsNodeId(task.wbsNodeId ?? '')
    setEstimateHours(
      task.estimateHours != null && Number.isFinite(task.estimateHours)
        ? String(task.estimateHours)
        : ''
    )
  }, [task])

  const phaseOptions = useMemo(
    () => [
      { value: '', label: 'No phase' },
      ...phases.map((p) => ({ value: p.id, label: p.name })),
    ],
    [phases]
  )

  const wbsOptions = useMemo(
    () => [
      { value: '', label: 'No WBS node' },
      ...flattenWbsOptions(wbsTree, 0, wbsNodeId || null),
    ],
    [wbsTree, wbsNodeId]
  )

  if (!open || !task) return null

  const actions = allowedTaskLifecycleActions(task.status)
  const assignable = canAssignTask(task.status)

  const handleClose = () => {
    onClose()
    if (closeHref) router.replace(closeHref)
  }

  const handleSave = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error('Title is required')
      return
    }

    let hours: number | null = null
    if (estimateHours.trim()) {
      hours = Number.parseFloat(estimateHours)
      if (!Number.isFinite(hours) || hours < 0.01) {
        toast.error('Estimate hours must be at least 0.01')
        return
      }
    }

    setSaving(true)
    try {
      await onSave(task.id, {
        title: trimmedTitle,
        description: description.trim() || null,
        priority,
        dueDate: dueDate || null,
        projectPhaseId: phaseId || null,
        inChargeUserId: assignable
          ? assigneeId || null
          : task.inChargeUserId ?? null,
        wbsNodeId: wbsNodeId || null,
        estimateHours: hours,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className="bg-neutral-900/[0.18] motion-drawer-backdrop fixed inset-0 z-40"
        aria-hidden
        onClick={handleClose}
      />
      <aside
        className="drawer motion-drawer-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl"
        role="dialog"
        aria-label="Task detail"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <Typography variant="small" className="font-mono text-neutral-500">
              {task.code}
            </Typography>
            <Typography as="h2" weight="semibold" className="truncate">
              {task.title}
            </Typography>
            <Stack direction="horizontal" spacing="sm" className="mt-2 items-center">
              <Badge
                variant="solid"
                tone={task.status === TaskStatus.Blocked ? 'warning' : 'neutral'}
              >
                {taskStatusLabel(task.status)}
              </Badge>
              <Badge tone="neutral">{taskPriorityLabel(priority)}</Badge>
            </Stack>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close"
            onClick={handleClose}
            icon={<X size={16} />}
          />
        </div>

        <nav className="flex gap-1 border-b border-neutral-200 px-5">
          {(['details', 'dependencies', 'resources', 'comments'] as DrawerTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              )}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {tab === 'details' ? (
            <>
              <Input
                label="Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                label="Description"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <div>
                <Typography variant="small" className="mb-1.5">
                  Priority
                </Typography>
                <Select value={priority} onValueChange={setPriority} options={PRIORITY_OPTIONS} />
              </div>
              <div>
                <Typography variant="small" className="mb-1.5">
                  Phase
                </Typography>
                <Select value={phaseId} onValueChange={setPhaseId} options={phaseOptions} />
              </div>
              <UserSearchSelect
                label="Assignee"
                value={assigneeId}
                onChange={setAssigneeId}
                seedPeople={assigneePeople}
                allowRemoteSearch={false}
                disabled={!assignable}
              />
              {!assignable && (
                <Typography variant="caption" tone="muted" className="-mt-2">
                  Completed or closed tasks cannot be reassigned
                </Typography>
              )}
              <div>
                <Typography variant="small" className="mb-1.5">
                  WBS node
                </Typography>
                <Select value={wbsNodeId} onValueChange={setWbsNodeId} options={wbsOptions} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Estimate (h)"
                  type="number"
                  min={0.01}
                  step={0.25}
                  fullWidth
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(e.target.value)}
                  placeholder="e.g. 4"
                />
                <Input
                  label="Due date"
                  type="date"
                  fullWidth
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
          ) : tab === 'dependencies' ? (
            <TaskDependenciesPanel
              projectId={projectId}
              taskId={task.id}
              currentTaskTitle={task.title}
            />
          ) : tab === 'resources' ? (
            <TaskResourcesPanel workspaceId={workspaceId} projectId={projectId} taskId={task.id} />
          ) : (
            <CommentThreadsPanel projectId={projectId} targetType="TASK" targetId={task.id} />
          )}
        </div>

        <div className="space-y-3 border-t border-neutral-200 px-5 py-4">
          {actions.length > 0 && (
            <Stack direction="horizontal" spacing="sm" className="flex-wrap">
              {actions.map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant={action === 'archive' || action === 'cancel' ? 'ghost' : 'secondary'}
                  disabled={acting}
                  onClick={() => void onLifecycle(task.id, action)}
                >
                  {ACTION_LABEL[action]}
                </Button>
              ))}
            </Stack>
          )}
          {tab === 'details' ? (
            <Button variant="primary" fullWidth loading={saving} onClick={() => void handleSave()}>
              Save changes
            </Button>
          ) : null}
        </div>
      </aside>
    </>
  )
}
