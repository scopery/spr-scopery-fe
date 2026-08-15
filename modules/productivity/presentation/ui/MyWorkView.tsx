'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Badge, Button, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { MyWorkWindow } from '../../domain/enums/my-work.enum'
import type { MyWorkTaskItem } from '../../domain/model/my-work'
import { useMyWork } from '../hooks/useMyWork'

const WINDOW_OPTIONS: { value: string; label: string }[] = [
  { value: MyWorkWindow.ThisWeek, label: 'This week' },
  { value: MyWorkWindow.Overdue, label: 'Overdue' },
  { value: MyWorkWindow.Upcoming, label: 'Upcoming' },
  { value: MyWorkWindow.AllOpen, label: 'All open' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Completed' },
]

function statusLabel(status: string) {
  switch (status) {
    case 'TODO':
      return 'To do'
    case 'IN_PROGRESS':
      return 'In progress'
    case 'BLOCKED':
      return 'Blocked'
    case 'DONE':
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    case 'ARCHIVED':
      return 'Archived'
    default:
      return status
  }
}

function priorityLabel(priority: string) {
  switch (priority) {
    case 'LOW':
      return 'Low'
    case 'MEDIUM':
      return 'Medium'
    case 'HIGH':
      return 'High'
    case 'CRITICAL':
      return 'Critical'
    default:
      return priority
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByProject(items: MyWorkTaskItem[]) {
  const map = new Map<
    string,
    { projectId: string; projectCode: string; projectName: string; tasks: MyWorkTaskItem[] }
  >()
  for (const item of items) {
    const existing = map.get(item.projectId)
    if (existing) {
      existing.tasks.push(item)
    } else {
      map.set(item.projectId, {
        projectId: item.projectId,
        projectCode: item.projectCode,
        projectName: item.projectName,
        tasks: [item],
      })
    }
  }
  return [...map.values()]
}

export function MyWorkView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [window, setWindow] = useState<string>(MyWorkWindow.ThisWeek)
  const [status, setStatus] = useState('')
  const [includeCompleted, setIncludeCompleted] = useState(false)
  const [page, setPage] = useState(0)

  const { items, summary, pageInfo, dateFrom, dateTo, loading, error, refetch } = useMyWork(
    workspaceId,
    {
      window,
      status: status || undefined,
      includeCompleted: includeCompleted || status === 'DONE',
      page,
      size: 50,
    }
  )

  const groups = useMemo(() => groupByProject(items), [items])

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" />
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <Typography as="h1" size="md" weight="medium">
            My Work
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Tasks assigned to you
            {dateFrom && dateTo ? ` · ${formatDate(dateFrom)} – ${formatDate(dateTo)}` : ''}
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[9.5rem]">
            <Select
              size="md"
              value={window}
              onValueChange={(v: string) => {
                setWindow(v)
                setPage(0)
              }}
              options={WINDOW_OPTIONS}
              aria-label="Time window"
            />
          </div>
          <div className="w-[9.5rem]">
            <Select
              size="md"
              value={status}
              onValueChange={(v: string) => {
                setStatus(v)
                setPage(0)
                if (v === 'DONE') setIncludeCompleted(true)
              }}
              options={STATUS_OPTIONS}
              aria-label="Status filter"
            />
          </div>
          <Button
            variant={includeCompleted ? 'outline' : 'ghost'}
            size="sm"
            aria-pressed={includeCompleted}
            onClick={() => {
              setIncludeCompleted((v) => !v)
              setPage(0)
            }}
          >
            {includeCompleted ? 'Hide completed' : 'Show completed'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="solid" tone="neutral">
          {summary.total} total
        </Badge>
        <Badge variant="solid" tone="error">
          {summary.overdue} overdue
        </Badge>
        <Badge variant="solid" tone="info">
          {summary.dueThisWindow} in window
        </Badge>
        <Badge variant="solid" tone="success">
          {summary.inProgress} in progress
        </Badge>
        <Badge variant="solid" tone="neutral">
          {summary.todo} to do
        </Badge>
        {summary.blocked > 0 ? (
          <Badge variant="solid" tone="warning">
            {summary.blocked} blocked
          </Badge>
        ) : null}
        {summary.undated > 0 ? (
          <Badge variant="solid" className="bg-cyan-500 text-white">
            {summary.undated} undated
          </Badge>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-8 text-center">
          <Typography tone="muted">No tasks in this view.</Typography>
        </div>
      ) : (
        <Stack direction="vertical" spacing="md">
          {groups.map((group) => (
            <section key={group.projectId} className="border border-neutral-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
                <div className="min-w-0">
                  <Typography weight="semibold" className="truncate">
                    {group.projectName}
                  </Typography>
                  <Typography variant="small" tone="muted" className="font-mono">
                    {group.projectCode}
                  </Typography>
                </div>
                <Link
                  href={ROUTES.workspace.projectWork(workspaceId, group.projectId)}
                  className="text-sm text-primary hover:underline"
                >
                  Open Work Items
                </Link>
              </div>
              <ul className="divide-y divide-neutral-100">
                {group.tasks.map((task) => (
                  <li key={task.taskId}>
                    <Link
                      href={ROUTES.workspace.projectWorkTask(
                        workspaceId,
                        task.projectId,
                        task.taskId
                      )}
                      className={cn(
                        'flex flex-wrap items-start justify-between gap-3 px-4 py-3',
                        'transition-colors hover:bg-neutral-50'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Typography variant="small" className="font-mono text-neutral-500">
                            {task.code}
                          </Typography>
                          {task.isOverdue ? (
                            <Badge variant="solid" tone="error" size="sm">
                              Overdue
                            </Badge>
                          ) : null}
                          <Badge tone="neutral" size="sm">
                            {statusLabel(task.status)}
                          </Badge>
                          <Badge tone="neutral" size="sm">
                            {priorityLabel(task.priority)}
                          </Badge>
                        </div>
                        <Typography weight="medium" className="mt-1">
                          {task.title}
                        </Typography>
                        {task.projectPhaseName ? (
                          <Typography variant="small" tone="muted" className="mt-0.5">
                            Phase · {task.projectPhaseName}
                          </Typography>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right text-sm text-neutral-600">
                        <div>Due {formatDate(task.dueDate)}</div>
                        <div className="text-neutral-400">
                          Start {formatDate(task.plannedStartDate)}
                        </div>
                        {task.estimateHours != null ? (
                          <div className="text-neutral-400">{task.estimateHours}h</div>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </Stack>
      )}

      {pageInfo.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Typography variant="small" tone="muted">
            Page {pageInfo.page + 1} of {pageInfo.totalPages} · {pageInfo.totalElements} tasks
          </Typography>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page + 1>= pageInfo.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
