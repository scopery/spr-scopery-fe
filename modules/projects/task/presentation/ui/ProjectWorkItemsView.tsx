'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import {
  Typography,
  Button,
  Input,
  Select,
  PageSkeleton,
  Stack,
  Badge,
} from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectPhases } from '../../../phase/presentation/hooks/useProjectPhases'
import { useProjectTasks } from '../hooks/useProjectTasks'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import { CreateTaskModal } from './CreateTaskModal'
import type { ProjectTask } from '../../domain/model/task'
import {
  BOARD_COLUMNS,
  taskLifecycleActionForBoardMove,
  taskPriorityLabel,
  taskStatusLabel,
} from '../../domain/rules/task.rules'
import { TaskStatus } from '../../../project/domain/enums/project.enum'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: TaskStatus.Todo, label: 'To do' },
  { value: TaskStatus.InProgress, label: 'In progress' },
  { value: TaskStatus.Blocked, label: 'Blocked' },
  { value: TaskStatus.Completed, label: 'Completed' },
  { value: TaskStatus.Cancelled, label: 'Cancelled' },
]

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function WorkItemsContent({ deepLinkTaskId }: { deepLinkTaskId?: string }) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const view = searchParams.get('view') === 'board' ? 'board' : 'list'
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)

  const { project } = useProject(workspaceId, projectId)
  const { phases } = useProjectPhases(projectId)
  const {
    tasks,
    loading,
    error,
    forbidden,
    actingId,
    createTask,
    updateTask,
    getTask,
    runLifecycle,
    refetch,
  } = useProjectTasks(projectId, {
    keyword: keyword.trim() || undefined,
    status: statusFilter || undefined,
    projectPhaseId: phaseFilter || undefined,
  })

  const assigneeIds = useMemo(() => tasks.map((t) => t.inChargeUserId), [tasks])
  const { peopleById } = useResolveUsers(assigneeIds)

  const phaseNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of phases) map.set(p.id, p.name)
    return map
  }, [phases])

  const filteredTasks = useMemo(() => {
    if (!assigneeFilter.trim()) return tasks
    const q = assigneeFilter.trim().toLowerCase()
    return tasks.filter((t) => {
      const id = (t.inChargeUserId ?? '').toLowerCase()
      const person = t.inChargeUserId ? peopleById[t.inChargeUserId] : null
      const name = (person?.fullName ?? person?.email ?? '').toLowerCase()
      return id.includes(q) || name.includes(q)
    })
  }, [tasks, assigneeFilter, peopleById])

  const openTask = useCallback(
    async (taskId: string) => {
      const fromList = tasks.find((t) => t.id === taskId)
      if (fromList) {
        setSelectedTask(fromList)
      } else {
        const loaded = await getTask(taskId)
        if (loaded) setSelectedTask(loaded)
      }
      router.replace(ROUTES.workspace.projectWorkTask(workspaceId, projectId, taskId))
    },
    [tasks, getTask, router, workspaceId, projectId]
  )

  useEffect(() => {
    if (!deepLinkTaskId) return
    void openTask(deepLinkTaskId)
  }, [deepLinkTaskId, openTask])

  const setView = (next: 'list' | 'board') => {
    const href = ROUTES.workspace.projectWork(workspaceId, projectId, next)
    router.replace(href)
  }

  const handleBoardDrop = async (toStatus: string) => {
    if (!dragTaskId) return
    const task = tasks.find((t) => t.id === dragTaskId)
    setDragTaskId(null)
    if (!task) return
    const action = taskLifecycleActionForBoardMove(task.status, toStatus)
    if (!action) {
      toast.error('That status transition is not allowed')
      return
    }
    try {
      await runLifecycle(task.id, action)
      toast.success('Task updated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && tasks.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to work items</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        className="mb-4"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Work items
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New task
        </Button>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-4 w-full flex-wrap items-center">
        <div className="inline-flex shrink-0 border border-neutral-200">
          <Button
            size="sm"
            variant={view === 'list' ? 'secondary' : 'ghost'}
            className="rounded-none"
            onClick={() => setView('list')}
          >
            List
          </Button>
          <Button
            size="sm"
            variant={view === 'board' ? 'secondary' : 'ghost'}
            className="rounded-none"
            onClick={() => setView('board')}
          >
            Board
          </Button>
        </div>
        <div className="min-w-[12rem] flex-1 basis-[12rem]">
          <Input
            fullWidth
            placeholder="Search…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
          className="min-w-[10rem] flex-1 basis-[10rem]"
        />
        <Select
          value={phaseFilter}
          onValueChange={setPhaseFilter}
          options={[
            { value: '', label: 'All phases' },
            ...phases.map((p) => ({ value: p.id, label: p.name })),
          ]}
          className="min-w-[11rem] flex-1 basis-[11rem]"
        />
        <div className="min-w-[10rem] flex-1 basis-[10rem]">
          <Input
            fullWidth
            placeholder="Assignee id…"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          />
        </div>
      </Stack>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      {view === 'list' ? (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Code / Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Estimate</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No tasks found
                    </Typography>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => void openTask(t.id)}
                      >
                        <Typography as="span" variant="small" tone="muted" className="font-mono">
                          {t.code}
                        </Typography>
                        <Typography as="div" weight="medium">
                          {t.title}
                        </Typography>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{taskStatusLabel(t.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">{taskPriorityLabel(t.priority)}</td>
                    <td className="px-4 py-3">
                      <UserIdentity
                        userId={t.inChargeUserId}
                        person={t.inChargeUserId ? peopleById[t.inChargeUserId] : null}
                        size="xs"
                        compact
                      />
                    </td>
                    <td className="px-4 py-3">
                      {t.projectPhaseId
                        ? (phaseNameById.get(t.projectPhaseId) ?? t.projectPhaseId.slice(0, 8))
                        : '—'}
                    </td>
                    <td className="px-4 py-3">{t.estimateHours ?? '—'}</td>
                    <td className="px-4 py-3">{formatDate(t.dueDate)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => void openTask(t.id)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {BOARD_COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.status)
            return (
              <div
                key={col.status}
                className="min-h-[20rem] border border-neutral-200 bg-neutral-50 p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => void handleBoardDrop(col.status)}
              >
                <Typography weight="medium" className="mb-3">
                  {col.label}{' '}
                  <Typography as="span" tone="muted">
                    ({columnTasks.length})
                  </Typography>
                </Typography>
                <ul className="space-y-2">
                  {columnTasks.map((t) => (
                    <li
                      key={t.id}
                      draggable
                      onDragStart={() => setDragTaskId(t.id)}
                      onDragEnd={() => setDragTaskId(null)}
                      className="cursor-grab border border-neutral-200 bg-white p-3 active:cursor-grabbing"
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => void openTask(t.id)}
                      >
                        <Typography variant="small" className="font-mono text-neutral-500">
                          {t.code}
                        </Typography>
                        <Typography weight="medium">{t.title}</Typography>
                        <Typography variant="small" tone="muted" className="mt-1">
                          {taskPriorityLabel(t.priority)} · Due {formatDate(t.dueDate)}
                        </Typography>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <CreateTaskModal
        open={createOpen}
        phases={phases}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await createTask(body)
            toast.success('Task created')
            await refetch()
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <TaskDetailDrawer
        workspaceId={workspaceId}
        projectId={projectId}
        phases={phases}
        task={selectedTask}
        open={!!selectedTask}
        acting={actingId === selectedTask?.id}
        onClose={() => setSelectedTask(null)}
        onLifecycle={async (taskId, action) => {
          try {
            await runLifecycle(taskId, action)
            toast.success('Task updated')
            const refreshed = await getTask(taskId)
            if (refreshed) setSelectedTask(refreshed)
          } catch (err) {
            toast.error(getProblemToastMessage(err))
          }
        }}
        onSave={async (taskId, body) => {
          try {
            const updated = await updateTask(taskId, body)
            if (updated) setSelectedTask(updated)
            toast.success('Saved')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}

export function ProjectWorkItemsView({ taskId }: { taskId?: string }) {
  return (
    <Suspense fallback={<PageSkeleton variant="list" />}>
      <WorkItemsContent deepLinkTaskId={taskId} />
    </Suspense>
  )
}
