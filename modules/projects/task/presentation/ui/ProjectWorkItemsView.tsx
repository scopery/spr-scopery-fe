'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Plus } from 'lucide-react'
import {
  Typography,
  Button,
  Card,
  Input,
  Select,
  PageSkeleton,
  Stack,
  Badge,
  Checkbox,
  DataTable,
  uiControl,
  uiDropdownPanel,
} from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import {
  UserIdentity,
  UserSearchSelect,
  useResolveUsers,
  WorkspaceHierarchyBreadcrumb,
} from '@/modules/platform'
import { useWorkspaceMemberPeople } from '@/modules/org/workspace'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectPhases } from '../../../phase/presentation/hooks/useProjectPhases'
import { useProjectTasks } from '../hooks/useProjectTasks'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskJsonImportModal } from './TaskJsonImportModal'
import * as tasksApi from '../../infrastructure/api/tasks.api'
import type { ProjectTask } from '../../domain/model/task'
import {
  BOARD_COLUMNS,
  taskLifecycleActionForBoardMove,
  taskPriorityLabel,
  taskStatusLabel,
} from '../../domain/rules/task.rules'
import { TaskStatus } from '../../../project/domain/enums/project.enum'
import { cn } from '@/utils/cn'

const DEFAULT_STATUS_FILTERS = [TaskStatus.Todo, TaskStatus.InProgress] as const

const STATUS_CHECKBOX_OPTIONS: { value: string; label: string }[] = [
  { value: TaskStatus.Todo, label: 'To do' },
  { value: TaskStatus.InProgress, label: 'In progress' },
  { value: TaskStatus.Blocked, label: 'Blocked' },
  { value: TaskStatus.Completed, label: 'Completed' },
  { value: TaskStatus.Cancelled, label: 'Cancelled' },
  { value: TaskStatus.Archived, label: 'Archived' },
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
  const { people: assigneePeople } = useWorkspaceMemberPeople(workspaceId)

  const view = searchParams.get('view') === 'board' ? 'board' : 'list'
  const [keyword, setKeyword] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...DEFAULT_STATUS_FILTERS])
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [phaseFilter, setPhaseFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [importExcelOpen, setImportExcelOpen] = useState(false)
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
    deleteTask,
    runLifecycle,
    refetch,
  } = useProjectTasks(projectId, {
    keyword: keyword.trim() || undefined,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    projectPhaseId: phaseFilter || undefined,
  })

  const toggleStatus = (value: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(value)) return prev.filter((s) => s !== value)
      return [...prev, value]
    })
  }

  const statusFilterLabel = useMemo(() => {
    if (selectedStatuses.length === 0) return 'No statuses'
    if (
      selectedStatuses.length === DEFAULT_STATUS_FILTERS.length &&
      DEFAULT_STATUS_FILTERS.every((s) => selectedStatuses.includes(s))
    ) {
      return 'To do & In progress'
    }
    if (selectedStatuses.length === STATUS_CHECKBOX_OPTIONS.length) return 'All statuses'
    if (selectedStatuses.length === 1) {
      return STATUS_CHECKBOX_OPTIONS.find((o) => o.value === selectedStatuses[0])?.label ?? 'Status'
    }
    return `${selectedStatuses.length} statuses`
  }, [selectedStatuses])

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
      <Card className="p-8 text-center">
        <Typography weight="medium">You don’t have access to work items</Typography>
      </Card>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        className="mb-1"
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Work items
          </Typography>
          {project ? (
            <Typography variant="caption" tone="muted" className="mt-0.5">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportExcelOpen(true)}>
            Import JSON
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            New task
          </Button>
        </div>
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
        <div className="relative min-w-[10rem] flex-1 basis-[10rem]">
          <button
            type="button"
            className={cn(
              uiControl,
              'flex h-9 w-full min-w-0 items-center justify-between gap-2 overflow-hidden px-3',
              'text-[13px] text-neutral-900',
              'transition-colors duration-200'
            )}
            onClick={() => setStatusMenuOpen((v) => !v)}
            aria-expanded={statusMenuOpen}
            aria-haspopup="listbox"
            aria-label="Filter by status"
          >
            <span className="min-w-0 flex-1 truncate text-left">{statusFilterLabel}</span>
            <ChevronDown
              size={16}
              className={cn('shrink-0 transition-transform', statusMenuOpen && 'rotate-180')}
            />
          </button>
          {statusMenuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Close status filter"
                onClick={() => setStatusMenuOpen(false)}
              />
              <div
                className={cn(
                  uiDropdownPanel,
                  'absolute left-0 top-full z-[100] mt-1 w-full overflow-hidden',
                  'shadow-lg',
                  'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2'
                )}
                role="listbox"
                aria-multiselectable
              >
                <ul className="max-h-[min(24rem,70vh)] overflow-y-auto p-1">
                  {STATUS_CHECKBOX_OPTIONS.map((opt) => {
                    const checked = selectedStatuses.includes(opt.value)
                    return (
                      <li key={opt.value} role="option" aria-selected={checked}>
                        <label
                          className={cn(
                            'relative flex cursor-pointer select-none items-center gap-2',
                            'px-3 py-2 text-sm text-neutral-900 outline-none',
                            'focus-within:bg-neutral-100 hover:bg-neutral-100',
                            opt.value === TaskStatus.Archived && 'mt-1 border-t border-neutral-100'
                          )}
                        >
                          <Checkbox
                            size="sm"
                            checked={checked}
                            onChange={() => toggleStatus(opt.value)}
                            aria-label={opt.label}
                          />
                          <span className="min-w-0 truncate">{opt.label}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          ) : null}
        </div>
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
          <UserSearchSelect
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            placeholder="Assignee"
            seedPeople={assigneePeople}
            allowRemoteSearch={false}
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
        <div className="border border-neutral-200 bg-white">
          <DataTable
            ariaLabel="Project work items"
            rows={filteredTasks}
            rowKey={(task) => task.id}
            emptyMessage="No tasks found"
            columns={[
              { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
              {
                id: 'title',
                header: 'Title',
                cell: (task) => (
                  <button
                    type="button"
                    className="text-left font-medium hover:underline"
                    onClick={() => void openTask(task.id)}
                  >
                    {task.title}
                  </button>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: (task) => <Badge tone="neutral">{taskStatusLabel(task.status)}</Badge>,
              },
              {
                id: 'priority',
                header: 'Priority',
                accessor: (task) => taskPriorityLabel(task.priority),
              },
              {
                id: 'assignee',
                header: 'Assignee',
                kind: 'reference',
                cell: (task) =>
                  task.inChargeUserId && peopleById[task.inChargeUserId] ? (
                    <UserIdentity
                      userId={task.inChargeUserId}
                      person={peopleById[task.inChargeUserId]}
                      size="xs"
                      compact
                    />
                  ) : (
                    '—'
                  ),
              },
              {
                id: 'phase',
                header: 'Phase',
                kind: 'reference',
                accessor: (task) =>
                  task.projectPhaseId ? (phaseNameById.get(task.projectPhaseId) ?? '—') : '—',
              },
              { id: 'estimate', header: 'Estimate', accessor: (task) => task.estimateHours ?? '—' },
              { id: 'due', header: 'Due', accessor: (task) => formatDate(task.dueDate) },
              {
                id: 'actions',
                header: 'Actions',
                cell: (task) => (
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => void openTask(task.id)}
                  >
                    Open
                  </button>
                ),
              },
            ]}
          />
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

      <TaskJsonImportModal
        open={importExcelOpen}
        onClose={() => setImportExcelOpen(false)}
        onSubmitBulk={(items) => tasksApi.submitTasksBulk(projectId, items)}
        onBatchComplete={() => refetch()}
      />

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
        closeHref={ROUTES.workspace.projectWork(workspaceId, projectId)}
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
        onDelete={async (taskId) => {
          await deleteTask(taskId)
          setSelectedTask(null)
          toast.success('Task deleted')
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
