'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge, Button, DetailDrawer, Typography } from '@/shared/ui'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { cn } from '@/utils/cn'
import { formatShortDate } from '../domain/rules/portfolio.rules'
import { useQuickAssignTasks } from '../hooks/useQuickAssignTasks'
import { useTeamPulse, type MemberPulseRow, type MemberPulseStatus } from '../hooks/useTeamPulse'
import type { WorkspaceMember } from '../model'
import type { DailySummaryTask } from '../model/workspace-daily-summary'
import type { UnassignedTaskItem } from './portfolio/WorkspaceUnassignedWork'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return dt.toISOString().slice(0, 10)
}

type StatusFilter = 'all' | 'working' | 'available'

// ─── Main view ────────────────────────────────────────────────────────────────

export function WorkspaceTeamPulseView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const today = todayIso()
  const [date, setDate] = useState(today)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [needsAttention, setNeedsAttention] = useState(false)
  const [viewMemberId, setViewMemberId] = useState<string | null>(null)
  const [unassignedOpen, setUnassignedOpen] = useState(false)
  const [assigningTask, setAssigningTask] = useState<UnassignedTaskItem | null>(null)

  const {
    memberRows,
    pulseSummary,
    unassignedTasks,
    members,
    loading,
    phaseWatchLoading,
    error,
    refetchPhaseWatch,
  } = useTeamPulse(workspaceId, date)

  const allUserIds = useMemo(() => memberRows.map((r) => r.userId), [memberRows])
  const { labelFor } = useResolveUsers(allUserIds)

  const isToday = date === today

  const filteredRows = useMemo(() => {
    let rows = [...memberRows]

    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r) => labelFor(r.userId).toLowerCase().includes(q))
    }
    if (needsAttention) {
      rows = rows.filter((r) => r.status === 'available')
    } else if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter)
    }

    return rows.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'working' ? -1 : 1
      return labelFor(a.userId).localeCompare(labelFor(b.userId))
    })
  }, [memberRows, search, statusFilter, needsAttention, labelFor])

  const viewMemberRow = viewMemberId
    ? (memberRows.find((r) => r.userId === viewMemberId) ?? null)
    : null

  const summaryItems: Array<{ label: string; value: number; filter: StatusFilter | null }> = [
    { label: 'Members', value: pulseSummary.totalMembers, filter: 'all' },
    { label: 'Working', value: pulseSummary.working, filter: 'working' },
    { label: 'Available', value: pulseSummary.available, filter: 'available' },
    { label: 'Done today', value: pulseSummary.doneToday, filter: null },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Typography as="h1" size="lg" weight="semibold">
              Team Pulse
            </Typography>
            <Typography variant="small" tone="muted" className="mt-0.5">
              Review daily work, workload and assignments across the Workspace.
            </Typography>
          </div>
          {/* Date navigator */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white hover:bg-neutral-50"
              onClick={() => setDate((d) => shiftDate(d, -1))}
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex h-8 min-w-[130px] items-center justify-center border border-neutral-200 bg-white px-3">
              <Typography variant="small" weight="medium">
                {isToday ? 'Today' : formatDisplayDate(date)}
              </Typography>
            </div>
            <button
              type="button"
              disabled={isToday}
              className="flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setDate((d) => shiftDate(d, 1))}
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
            {!isToday && (
              <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
                Today
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-4 flex flex-wrap gap-px border border-neutral-200 bg-neutral-200">
        {summaryItems.map(({ label, value, filter }) => (
          <button
            key={label}
            type="button"
            disabled={!filter}
            onClick={() => {
              if (!filter) return
              setNeedsAttention(false)
              setStatusFilter((prev) => (prev === filter ? 'all' : filter))
            }}
            className={cn(
              'flex flex-1 flex-col items-center bg-white px-4 py-3 transition-colors',
              filter && !needsAttention && statusFilter === filter
                ? 'bg-primary/5'
                : filter
                ? 'hover:bg-neutral-50 cursor-pointer'
                : 'cursor-default'
            )}
          >
            <Typography size="lg" weight="semibold" className="tabular-nums">
              {loading ? '—' : value}
            </Typography>
            <Typography variant="small" tone="muted">
              {label}
            </Typography>
          </button>
        ))}
        {/* Unassigned — opens drawer */}
        <button
          type="button"
          className="flex flex-1 flex-col items-center bg-white px-4 py-3 transition-colors hover:bg-neutral-50"
          onClick={() => setUnassignedOpen(true)}
        >
          <Typography
            size="lg"
            weight="semibold"
            className={cn(
              'tabular-nums',
              !phaseWatchLoading && pulseSummary.unassignedCount > 0 && 'text-error'
            )}
          >
            {phaseWatchLoading ? '—' : pulseSummary.unassignedCount}
          </Typography>
          <Typography variant="small" tone="muted">
            Unassigned
          </Typography>
        </button>
      </div>

      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : (
        <div className="flex gap-4">
          {/* Left: member table */}
          <div className="min-w-0 flex-1">
            {/* Filter bar */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search members…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 border border-neutral-300 bg-white px-3 text-sm focus:border-primary focus:outline-none"
                disabled={loading}
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setNeedsAttention((v) => !v)
                  setStatusFilter('all')
                }}
                className={cn(
                  'h-8 border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  needsAttention
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                )}
              >
                Needs attention
              </button>
            </div>

            {/* Table */}
            {loading ? (
              <MemberTableSkeleton />
            ) : filteredRows.length === 0 ? (
              <div className="border border-neutral-200 bg-white px-4 py-12 text-center">
                <Typography tone="muted" variant="small">
                  {search
                    ? `No members matching "${search}".`
                    : needsAttention
                    ? 'All members have active tasks — no one needs attention right now.'
                    : 'No member activity recorded for this date.'}
                </Typography>
              </div>
            ) : (
              <div className="border border-neutral-200 bg-white">
                <div className="grid grid-cols-[1fr_72px] border-b border-neutral-100 bg-neutral-50 px-4 py-2">
                  <Typography
                    variant="small"
                    tone="muted"
                    weight="medium"
                    className="text-xs uppercase tracking-wide"
                  >
                    Member
                  </Typography>
                  <Typography
                    variant="small"
                    tone="muted"
                    weight="medium"
                    className="text-right text-xs uppercase tracking-wide"
                  >
                    Actions
                  </Typography>
                </div>
                <ul className="divide-y divide-neutral-100">
                  {filteredRows.map((row) => (
                    <MemberWorkRow
                      key={row.userId}
                      row={row}
                      name={labelFor(row.userId)}
                      onView={() => setViewMemberId(row.userId)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: unassigned panel (desktop only) */}
          <div className="hidden w-72 shrink-0 xl:block">
            <UnassignedPanel
              tasks={unassignedTasks}
              loading={phaseWatchLoading}
              onViewAll={() => setUnassignedOpen(true)}
              onAssign={(task) => setAssigningTask(task)}
            />
          </div>
        </div>
      )}

      {/* Member detail drawer */}
      <MemberDetailDrawer
        open={!!viewMemberRow}
        row={viewMemberRow}
        name={viewMemberId ? labelFor(viewMemberId) : ''}
        date={date}
        onClose={() => setViewMemberId(null)}
      />

      {/* Full unassigned drawer */}
      <UnassignedFullDrawer
        open={unassignedOpen}
        tasks={unassignedTasks}
        members={members}
        labelFor={labelFor}
        onClose={() => setUnassignedOpen(false)}
        onAssigned={() => {
          void refetchPhaseWatch()
          setUnassignedOpen(false)
        }}
      />

      {/* Quick assign from panel */}
      {assigningTask ? (
        <QuickAssignDrawer
          open
          task={assigningTask}
          members={members}
          labelFor={labelFor}
          onClose={() => setAssigningTask(null)}
          onComplete={() => {
            setAssigningTask(null)
            void refetchPhaseWatch()
          }}
        />
      ) : null}
    </div>
  )
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function MemberTableSkeleton() {
  return (
    <div className="border border-neutral-200 bg-white">
      <div className="grid grid-cols-[1fr_72px] border-b border-neutral-100 bg-neutral-50 px-4 py-2">
        <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
      </div>
      <ul className="divide-y divide-neutral-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-14 animate-pulse rounded bg-neutral-100" />
              </div>
              <div className="h-3 w-48 animate-pulse rounded bg-neutral-100" />
            </div>
            <div className="h-7 w-12 animate-pulse rounded bg-neutral-100" />
          </li>
        ))}
      </ul>
    </div>
  )
}

function UnassignedPanelSkeleton() {
  return (
    <ul className="divide-y divide-neutral-100">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="space-y-2 px-4 py-3">
          <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
          <div className="h-7 w-14 animate-pulse rounded bg-neutral-100" />
        </li>
      ))}
    </ul>
  )
}

// ─── MemberWorkRow ────────────────────────────────────────────────────────────

function statusLabel(status: MemberPulseStatus): string {
  return status === 'working' ? 'Working' : 'Available'
}

function MemberWorkRow({
  row,
  name,
  onView,
}: {
  row: MemberPulseRow
  name: string
  onView: () => void
}) {
  const preview = row.inProgress.slice(0, 2)
  const extra = row.inProgress.length - 2

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Typography weight="semibold" className="truncate text-neutral-900">
              {name}
            </Typography>
            <Badge
              variant="soft"
              tone={row.status === 'working' ? 'info' : 'secondary'}
              size="sm"
            >
              {statusLabel(row.status)}
            </Badge>
            {row.done.length > 0 && (
              <Badge variant="soft" tone="success" size="sm">
                {row.done.length} done
              </Badge>
            )}
          </div>

          {preview.length > 0 ? (
            <ul className="mt-1.5 space-y-0.5">
              {preview.map((task) => (
                <li key={task.id} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-info" />
                  <Typography variant="small" className="truncate text-neutral-700">
                    {task.title}
                    {task.phaseName ? ` · ${task.phaseName}` : ''}
                  </Typography>
                </li>
              ))}
              {extra > 0 && (
                <li>
                  <button
                    type="button"
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                    onClick={onView}
                  >
                    +{extra} more
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <Typography variant="small" tone="muted" className="mt-1">
              No active tasks for this date.
            </Typography>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onView}>
          View
        </Button>
      </div>
    </li>
  )
}

// ─── UnassignedPanel ─────────────────────────────────────────────────────────

function UnassignedPanel({
  tasks,
  loading,
  onViewAll,
  onAssign,
}: {
  tasks: UnassignedTaskItem[]
  loading: boolean
  onViewAll: () => void
  onAssign: (task: UnassignedTaskItem) => void
}) {
  const preview = tasks.slice(0, 5)

  return (
    <div className="border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Typography as="h2" size="sm" weight="semibold">
            Unassigned Work
          </Typography>
          {tasks.length > 0 && (
            <Badge variant="solid" tone="error" size="sm">
              {tasks.length}
            </Badge>
          )}
        </div>
        {tasks.length > 5 && (
          <button
            type="button"
            className="text-sm text-neutral-500 hover:text-neutral-700"
            onClick={onViewAll}
          >
            View all
          </button>
        )}
      </div>

      {loading ? (
        <UnassignedPanelSkeleton />
      ) : tasks.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            No unassigned open tasks.
          </Typography>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {preview.map((task) => (
            <li key={task.taskId} className="px-4 py-3">
              <Typography
                variant="small"
                weight="medium"
                className="font-mono text-neutral-600"
              >
                {task.code}
              </Typography>
              <Typography weight="medium" className="leading-snug text-neutral-900">
                {task.title}
              </Typography>
              <Typography variant="small" tone="muted" className="mt-0.5">
                {task.projectName}
                {task.dueDate ? ` · Due ${formatShortDate(task.dueDate)}` : ''}
                {task.estimateHours != null ? ` · ${task.estimateHours}h` : ''}
              </Typography>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => onAssign(task)}
              >
                Assign
              </Button>
            </li>
          ))}
          {tasks.length > 5 && (
            <li className="px-4 py-2">
              <button
                type="button"
                className="text-sm text-neutral-500 hover:text-neutral-700"
                onClick={onViewAll}
              >
                +{tasks.length - 5} more — view all
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ─── MemberDetailDrawer ───────────────────────────────────────────────────────

function MemberDetailDrawer({
  open,
  row,
  name,
  date,
  onClose,
}: {
  open: boolean
  row: MemberPulseRow | null
  name: string
  date: string
  onClose: () => void
}) {
  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={name || '—'}
      subtitle={formatDisplayDate(date)}
    >
      {row ? (
        <>
          <div className="mb-4 flex gap-6 border-b border-neutral-100 pb-4">
            <div>
              <Typography size="lg" weight="semibold">
                {row.inProgress.length}
              </Typography>
              <Typography variant="small" tone="muted">
                Active
              </Typography>
            </div>
            <div>
              <Typography size="lg" weight="semibold">
                {row.done.length}
              </Typography>
              <Typography variant="small" tone="muted">
                Completed
              </Typography>
            </div>
          </div>

          {row.inProgress.length > 0 && (
            <div className="mb-4">
              <Typography
                variant="small"
                tone="muted"
                className="mb-2 text-xs uppercase tracking-wide"
              >
                Working on
              </Typography>
              <ul className="space-y-3">
                {row.inProgress.map((task) => (
                  <TaskDetailItem key={task.id} task={task} tone="info" />
                ))}
              </ul>
            </div>
          )}

          {row.done.length > 0 && (
            <div>
              <Typography
                variant="small"
                tone="muted"
                className="mb-2 text-xs uppercase tracking-wide"
              >
                Completed today
              </Typography>
              <ul className="space-y-3">
                {row.done.map((task) => (
                  <TaskDetailItem key={task.id} task={task} tone="success" />
                ))}
              </ul>
            </div>
          )}

          {row.inProgress.length === 0 && row.done.length === 0 && (
            <div className="py-10 text-center">
              <Typography tone="muted" variant="small">
                No tasks recorded for this date.
              </Typography>
            </div>
          )}
        </>
      ) : null}
    </DetailDrawer>
  )
}

function TaskDetailItem({
  task,
  tone,
}: {
  task: DailySummaryTask
  tone: 'info' | 'success'
}) {
  return (
    <li className="flex gap-2">
      <span
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          tone === 'success' ? 'bg-success' : 'bg-info'
        )}
      />
      <div className="min-w-0">
        <Typography weight="medium" className="text-neutral-900">
          {task.title}
        </Typography>
        <Typography variant="small" tone="muted">
          {task.code} · {task.projectName}
          {task.phaseName ? ` · ${task.phaseName}` : ''}
          {task.estimateHours != null ? ` · ${task.estimateHours}h` : ''}
        </Typography>
        {task.completedAt ? (
          <Typography variant="small" tone="muted">
            Completed at{' '}
            {new Date(task.completedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        ) : null}
      </div>
    </li>
  )
}

// ─── UnassignedFullDrawer ────────────────────────────────────────────────────

function UnassignedFullDrawer({
  open,
  tasks,
  members,
  labelFor,
  onClose,
  onAssigned,
}: {
  open: boolean
  tasks: UnassignedTaskItem[]
  members: WorkspaceMember[]
  labelFor: (id: string) => string
  onClose: () => void
  onAssigned: () => void
}) {
  const [assigningTask, setAssigningTask] = useState<UnassignedTaskItem | null>(null)

  useEffect(() => {
    if (!open) setAssigningTask(null)
  }, [open])

  return (
    <>
      <DetailDrawer
        open={open}
        onClose={onClose}
        title="Unassigned Work"
        subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''} · sorted by due date`}
      >
        {tasks.length === 0 ? (
          <div className="py-10 text-center">
            <Typography tone="muted" variant="small">
              No unassigned open tasks.
            </Typography>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {tasks.map((task) => (
              <li key={task.taskId} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Typography
                    variant="small"
                    weight="medium"
                    className="font-mono text-neutral-700"
                  >
                    {task.code}
                  </Typography>
                  <Typography weight="medium" className="text-neutral-900">
                    {task.title}
                  </Typography>
                  <Typography variant="small" tone="muted" className="mt-0.5">
                    {task.projectName}
                    {task.phaseName ? ` · ${task.phaseName}` : ''}
                    {task.dueDate ? ` · Due ${formatShortDate(task.dueDate)}` : ''}
                    {task.estimateHours != null ? ` · ${task.estimateHours}h` : ''}
                  </Typography>
                </div>
                <Button variant="outline" size="sm" onClick={() => setAssigningTask(task)}>
                  Assign
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DetailDrawer>

      {assigningTask ? (
        <QuickAssignDrawer
          open
          task={assigningTask}
          members={members}
          labelFor={labelFor}
          onClose={() => setAssigningTask(null)}
          onComplete={() => {
            setAssigningTask(null)
            onAssigned()
          }}
        />
      ) : null}
    </>
  )
}

// ─── QuickAssignDrawer ───────────────────────────────────────────────────────

function QuickAssignDrawer({
  open,
  task,
  members,
  labelFor,
  onClose,
  onComplete,
}: {
  open: boolean
  task: UnassignedTaskItem
  members: WorkspaceMember[]
  labelFor: (id: string) => string
  onClose: () => void
  onComplete: () => void
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const { assignTasks, submitting } = useQuickAssignTasks()

  useEffect(() => {
    if (open) {
      setSelectedUserId(null)
      setMemberSearch('')
    }
  }, [open])

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members
    const q = memberSearch.toLowerCase()
    return members.filter((m) => labelFor(m.userId).toLowerCase().includes(q))
  }, [members, memberSearch, labelFor])

  const handleAssign = async () => {
    if (!selectedUserId) return
    await assignTasks([{ projectId: task.projectId, taskId: task.taskId }], selectedUserId)
    onComplete()
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Assign Task"
      subtitle={task.title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedUserId || submitting}
            onClick={() => void handleAssign()}
          >
            {selectedUserId ? `Assign to ${labelFor(selectedUserId)}` : 'Select a person'}
          </Button>
        </div>
      }
    >
      <div className="mb-4 space-y-1 border-b border-neutral-100 pb-4">
        <Typography variant="small" tone="muted">
          {task.projectName}
          {task.phaseName ? ` · ${task.phaseName}` : ''}
        </Typography>
        {task.estimateHours != null && (
          <Typography variant="small" tone="muted">
            Estimate · {task.estimateHours}h
          </Typography>
        )}
        {task.dueDate && (
          <Typography variant="small" tone="muted">
            Due · {formatShortDate(task.dueDate)}
          </Typography>
        )}
      </div>

      <Typography variant="small" weight="medium" className="mb-2">
        Select a person
      </Typography>
      <input
        type="text"
        placeholder="Search members…"
        value={memberSearch}
        onChange={(e) => setMemberSearch(e.target.value)}
        className="mb-3 h-8 w-full border border-neutral-300 bg-white px-3 text-sm focus:border-primary focus:outline-none"
      />
      <ul className="space-y-2">
        {filteredMembers.map((member) => (
          <li key={member.userId}>
            <button
              type="button"
              onClick={() => setSelectedUserId(member.userId)}
              className={cn(
                'w-full border px-3 py-2.5 text-left transition-colors',
                selectedUserId === member.userId
                  ? 'border-primary bg-primary/5'
                  : 'border-neutral-200 hover:bg-neutral-50'
              )}
            >
              <Typography weight="medium">{labelFor(member.userId)}</Typography>
            </button>
          </li>
        ))}
        {filteredMembers.length === 0 && (
          <Typography variant="small" tone="muted">
            No members found.
          </Typography>
        )}
      </ul>
    </DetailDrawer>
  )
}
