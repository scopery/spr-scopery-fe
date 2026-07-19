'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Badge, Button, Input, Stack, Textarea, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import type { ProjectTask } from '../../domain/model/task'
import {
  allowedTaskLifecycleActions,
  taskPriorityLabel,
  taskStatusLabel,
  type TaskLifecycleAction,
} from '../../domain/rules/task.rules'
import { TaskStatus } from '../../../project/domain/enums/project.enum'
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
}

interface TaskDetailDrawerProps {
  workspaceId: string
  projectId: string
  task: ProjectTask | null
  open: boolean
  acting?: boolean
  onClose: () => void
  onLifecycle: (taskId: string, action: TaskLifecycleAction) => Promise<void>
  onSave: (
    taskId: string,
    body: { title: string; description: string | null; dueDate: string | null }
  ) => Promise<void>
}

export function TaskDetailDrawer({
  workspaceId,
  projectId,
  task,
  open,
  acting,
  onClose,
  onLifecycle,
  onSave,
}: TaskDetailDrawerProps) {
  const router = useRouter()
  const [tab, setTab] = useState<DrawerTab>('details')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const { peopleById } = useResolveUsers([task?.inChargeUserId])

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setDueDate(task.dueDate ?? '')
  }, [task])

  if (!open || !task) return null

  const actions = allowedTaskLifecycleActions(task.status)

  const handleClose = () => {
    onClose()
    router.replace(`/workspace/${workspaceId}/projects/${projectId}/work`)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-neutral-900/[0.18] motion-drawer-backdrop"
        aria-hidden
        onClick={handleClose}
      />
      <aside
        className="drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl motion-drawer-panel"
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
              <Badge tone="neutral">{taskPriorityLabel(task.priority)}</Badge>
            </Stack>
          </div>
          <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={handleClose} icon={<X size={16} />} />
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
              <Input
                label="Due date"
                type="date"
                fullWidth
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Typography variant="small" tone="muted">
                    Assignee
                  </Typography>
                  <UserIdentity
                    userId={task.inChargeUserId}
                    person={task.inChargeUserId ? peopleById[task.inChargeUserId] : null}
                    size="xs"
                    compact
                  />
                </div>
                <div>
                  <Typography variant="small" tone="muted">
                    Phase ID
                  </Typography>
                  <Typography className="font-mono text-xs">
                    {task.projectPhaseId ? `${task.projectPhaseId.slice(0, 8)}…` : '—'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" tone="muted">
                    WBS node
                  </Typography>
                  <Typography className="font-mono text-xs">
                    {task.wbsNodeId ? `${task.wbsNodeId.slice(0, 8)}…` : '—'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" tone="muted">
                    Estimate (h)
                  </Typography>
                  <Typography>{task.estimateHours ?? '—'}</Typography>
                </div>
              </div>
            </>
          ) : tab === 'dependencies' ? (
            <TaskDependenciesPanel projectId={projectId} taskId={task.id} />
          ) : tab === 'resources' ? (
            <TaskResourcesPanel
              workspaceId={workspaceId}
              projectId={projectId}
              taskId={task.id}
            />
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
          <Button variant="primary" fullWidth loading={saving} onClick={() => void handleSave()}>
            Save changes
          </Button>
        </div>
      </aside>
    </>
  )
}
