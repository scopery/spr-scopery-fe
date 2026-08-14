'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
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
  AnchoredMenu,
  anchoredMenuItemClassName,
} from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
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
import { WorkItemsChartView } from './WorkItemsChartView'
import * as tasksApi from '../../infrastructure/api/tasks.api'
import type { ProjectTask } from '../../domain/model/task'
import {
  BOARD_COLUMNS,
  compareTasksForWorkQueue,
  isTaskOverdue,
  taskLifecycleActionForBoardMove,
  taskPriorityLabel,
  taskStatusLabel,
} from '../../domain/rules/task.rules'
import { TaskStatus } from '../../../project/domain/enums/project.enum'
import { cn } from '@/utils/cn'
import { buildWorkItemsInsights } from '../../domain/rules/work-items-insights.rules'

type WorkView = 'list' | 'board' | 'chart'

const DEFAULT_STATUS_FILTERS = [TaskStatus.Todo, TaskStatus.InProgress] as const
const CHART_STATUSES = [
  TaskStatus.Todo,
  TaskStatus.InProgress,
  TaskStatus.Blocked,
  TaskStatus.Completed,
  TaskStatus.Cancelled,
] as const
const WORK_FILTERS_STORAGE_PREFIX = 'scopery.work-items.filters.'

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

function readStoredFilters(projectId: string) {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${WORK_FILTERS_STORAGE_PREFIX}${projectId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      keyword?: string
      selectedStatuses?: string[]
      phaseFilter?: string
      assigneeFilter?: string
    }
    return parsed
  } catch {
    return null
  }
}

function WorkItemsContent() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const { people: assigneePeople } = useWorkspaceMemberPeople(workspaceId)
  const listScrollRef = useRef<HTMLDivElement>(null)

  const rawView = searchParams.get('view')
  const view: WorkView =
    rawView === 'board' || rawView === 'chart' ? rawView : 'list'
  const queryTaskId = searchParams.get('task')
  const storedFilters = useMemo(() => readStoredFilters(projectId), [projectId])
  const [keyword, setKeyword] = useState(storedFilters?.keyword ?? '')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    storedFilters?.selectedStatuses?.length
      ? storedFilters.selectedStatuses
      : [...DEFAULT_STATUS_FILTERS]
  )
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [phaseFilter, setPhaseFilter] = useState(storedFilters?.phaseFilter ?? '')
  const [assigneeFilter, setAssigneeFilter] = useState(storedFilters?.assigneeFilter ?? '')
  const [createOpen, setCreateOpen] = useState(false)
  const [importExcelOpen, setImportExcelOpen] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuAnchorRef = useRef<HTMLDivElement>(null)
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
    status:
      view === 'chart'
        ? [...CHART_STATUSES]
        : selectedStatuses.length > 0
          ? selectedStatuses
          : undefined,
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
    const q = assigneeFilter.trim().toLowerCase()
    const next = q
      ? tasks.filter((t) => {
          const id = (t.inChargeUserId ?? '').toLowerCase()
          const person = t.inChargeUserId ? peopleById[t.inChargeUserId] : null
          const name = (person?.fullName ?? person?.email ?? '').toLowerCase()
          return id.includes(q) || name.includes(q)
        })
      : [...tasks]
    next.sort(compareTasksForWorkQueue)
    return next
  }, [tasks, assigneeFilter, peopleById])

  const insights = useMemo(
    () => buildWorkItemsInsights(filteredTasks, phaseNameById),
    [filteredTasks, phaseNameById]
  )

  const workHref = useCallback(
    (opts?: { view?: WorkView; taskId?: string | null }) => {
      const nextView = opts?.view ?? view
      const next = new URLSearchParams()
      if (nextView !== 'list') next.set('view', nextView)
      const taskId =
        opts && 'taskId' in opts ? opts.taskId : (queryTaskId || null)
      if (taskId && nextView !== 'chart') next.set('task', taskId)
      const qs = next.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [pathname, queryTaskId, view]
  )

  const openTask = useCallback(
    (taskId: string) => {
      const fromList = tasks.find((t) => t.id === taskId)
      if (fromList) setSelectedTask(fromList)
      router.replace(workHref({ taskId }), { scroll: false })
    },
    [tasks, router, workHref]
  )

  const closeTask = useCallback(() => {
    setSelectedTask(null)
    router.replace(workHref({ taskId: null }), { scroll: false })
  }, [router, workHref])

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `${WORK_FILTERS_STORAGE_PREFIX}${projectId}`,
        JSON.stringify({ keyword, selectedStatuses, phaseFilter, assigneeFilter })
      )
    } catch {
      /* ignore quota / private mode */
    }
  }, [projectId, keyword, selectedStatuses, phaseFilter, assigneeFilter])

  useEffect(() => {
    const el = listScrollRef.current
    if (!el) return
    const key = `scopery.work-items.scroll.${projectId}`
    const saved = sessionStorage.getItem(key)
    if (saved) el.scrollTop = Number(saved) || 0
    const onScroll = () => {
      sessionStorage.setItem(key, String(el.scrollTop))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [projectId, view])

  useEffect(() => {
    const taskId = queryTaskId
    if (!taskId) {
      setSelectedTask(null)
      return
    }
    const fromList = tasks.find((t) => t.id === taskId)
    if (fromList) {
      setSelectedTask(fromList)
      return
    }
    let cancelled = false
    void getTask(taskId).then((loaded) => {
      if (!cancelled && loaded) setSelectedTask(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [queryTaskId, tasks, getTask])

  const setView = (next: WorkView) => {
    router.replace(workHref({ view: next }), { scroll: false })
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
        <div ref={addMenuAnchorRef} className="relative">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setAddMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={addMenuOpen}
          >
            Add task
            <ChevronDown
              size={14}
              className={cn('ml-1 shrink-0 transition-transform', addMenuOpen && 'rotate-180')}
            />
          </Button>
          <AnchoredMenu
            open={addMenuOpen}
            onClose={() => setAddMenuOpen(false)}
            anchorRef={addMenuAnchorRef}
            minWidth={160}
          >
            <button
              type="button"
              className={anchoredMenuItemClassName}
              onClick={() => {
                setAddMenuOpen(false)
                setCreateOpen(true)
              }}
            >
              Single task
            </button>
            <button
              type="button"
              className={anchoredMenuItemClassName}
              onClick={() => {
                setAddMenuOpen(false)
                setImportExcelOpen(true)
              }}
            >
              JSON import
            </button>
          </AnchoredMenu>
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
          <Button
            size="sm"
            variant={view === 'chart' ? 'secondary' : 'ghost'}
            className="rounded-none"
            onClick={() => setView('chart')}
          >
            Chart
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
        {view !== 'chart' ? (
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
        ) : null}
        <Select
          value={phaseFilter}
          onValueChange={setPhaseFilter}
          options={[
            { value: '', label: 'All phases' },
            ...phases.map((p) => ({ value: p.id, label: p.name })),
          ]}
          className="min-w-[11rem] flex-1 basis-[11rem]"
        />
        {view !== 'chart' ? (
        <div className="min-w-[10rem] flex-1 basis-[10rem]">
          <UserSearchSelect
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            placeholder="Assignee"
            seedPeople={assigneePeople}
            allowRemoteSearch={false}
          />
        </div>
        ) : null}
      </Stack>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      {view === 'list' ? (
        <div ref={listScrollRef} className="border border-neutral-200 bg-white">
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
                    onClick={() => openTask(task.id)}
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
                    onClick={() => openTask(task.id)}
                  >
                    Open
                  </button>
                ),
              },
            ]}
          />
        </div>
      ) : null}

      {view === 'board' ? (
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
                  {columnTasks.map((t) => {
                    const overdue = isTaskOverdue(t)
                    const person = t.inChargeUserId ? peopleById[t.inChargeUserId] : null
                    const phaseName = t.projectPhaseId
                      ? phaseNameById.get(t.projectPhaseId)
                      : null
                    return (
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
                          onClick={() => openTask(t.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Typography variant="small" className="font-mono text-neutral-500">
                              {t.code}
                            </Typography>
                            {overdue ? (
                              <Badge tone="error">Overdue</Badge>
                            ) : t.status === TaskStatus.Blocked ? (
                              <Badge tone="warning">Blocked</Badge>
                            ) : null}
                          </div>
                          <Typography weight="medium" className="mt-1">
                            {t.title}
                          </Typography>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge tone="neutral">{taskPriorityLabel(t.priority)}</Badge>
                            {phaseName ? (
                              <Typography variant="caption" tone="muted">
                                {phaseName}
                              </Typography>
                            ) : null}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <Typography variant="small" tone={overdue ? 'error' : 'muted'}>
                              Due {formatDate(t.dueDate)}
                            </Typography>
                            {t.inChargeUserId && person ? (
                              <UserIdentity
                                userId={t.inChargeUserId}
                                person={person}
                                size="xs"
                                compact
                              />
                            ) : (
                              <Typography variant="caption" tone="muted">
                                Unassigned
                              </Typography>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      ) : null}

      {view === 'chart' ? <WorkItemsChartView insights={insights} /> : null}

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
        onClose={closeTask}
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
          closeTask()
          toast.success('Task deleted')
        }}
      />
    </div>
  )
}

export function ProjectWorkItemsView() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" />}>
      <WorkItemsContent />
    </Suspense>
  )
}
