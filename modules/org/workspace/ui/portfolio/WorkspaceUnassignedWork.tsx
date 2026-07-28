'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Badge, Button, Checkbox, DetailDrawer, Typography } from '@/shared/ui'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import type { OverAllocationItem } from '@/modules/capacity/domain/model/capacity-overview'
import type { ResourceProfile } from '@/modules/capacity/domain/model/resource-profile'
import type { WorkspaceMember } from '../../model'
import { formatShortDate } from '../../domain/rules/portfolio.rules'
import type { PhaseWatchUnassignedTask } from '@/modules/projects/phase/domain/model/phase-watch'
import { useQuickAssignTasks } from '../../hooks/useQuickAssignTasks'
import { cn } from '@/utils/cn'

export type UnassignedTaskItem = PhaseWatchUnassignedTask & {
  projectId: string
  projectName: string
}

interface WorkspaceUnassignedWorkProps {
  tasks: UnassignedTaskItem[]
  members: WorkspaceMember[]
  resources: ResourceProfile[]
  overAllocations: OverAllocationItem[]
  onAssigned: () => void
}

function sortByDueDate(tasks: UnassignedTaskItem[]): UnassignedTaskItem[] {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })
}

export function WorkspaceUnassignedWork({
  tasks,
  members,
  resources,
  overAllocations,
  onAssigned,
}: WorkspaceUnassignedWorkProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<UnassignedTaskItem[] | null>(null)

  const sorted = useMemo(() => sortByDueDate(tasks), [tasks])
  const preview = sorted.slice(0, 5)

  return (
    <section id="unassigned-work" className="border border-neutral-200 bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Typography as="h2" size="sm" weight="semibold">
            Unassigned Work
          </Typography>
          {tasks.length > 0 ? (
            <Badge variant="solid" tone="error" size="sm">
              {tasks.length}
            </Badge>
          ) : null}
        </div>
        {tasks.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none bg-neutral-100 px-1.5 text-neutral-700 hover:bg-neutral-200"
            onClick={() => setDrawerOpen(true)}
            aria-label="View all unassigned tasks"
            title="View all unassigned tasks"
          >
            <ArrowUpRight size={18} aria-hidden />
          </Button>
        ) : null}
      </header>

      {tasks.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            No unassigned open tasks in watched projects.
          </Typography>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {preview.map((task) => (
            <li key={task.taskId} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Typography variant="small" weight="medium" className="font-mono text-neutral-700">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignTarget([task])}
              >
                Assign
              </Button>
            </li>
          ))}
          {tasks.length > 5 ? (
            <li className="px-4 py-2">
              <button
                type="button"
                className="text-sm text-neutral-500 hover:text-neutral-700"
                onClick={() => setDrawerOpen(true)}
              >
                +{tasks.length - 5} more — view all
              </button>
            </li>
          ) : null}
        </ul>
      )}

      <UnassignedFullDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tasks={sorted}
        members={members}
        resources={resources}
        overAllocations={overAllocations}
        onAssigned={() => {
          onAssigned()
          setDrawerOpen(false)
        }}
      />

      <QuickAssignDrawer
        open={!!assignTarget}
        tasks={assignTarget ?? []}
        members={members}
        resources={resources}
        overAllocations={overAllocations}
        onClose={() => setAssignTarget(null)}
        onComplete={() => {
          setAssignTarget(null)
          onAssigned()
        }}
      />
    </section>
  )
}

function UnassignedFullDrawer({
  open,
  onClose,
  tasks,
  members,
  resources,
  overAllocations,
  onAssigned,
}: {
  open: boolean
  onClose: () => void
  tasks: UnassignedTaskItem[]
  members: WorkspaceMember[]
  resources: ResourceProfile[]
  overAllocations: OverAllocationItem[]
  onAssigned: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assignTarget, setAssignTarget] = useState<UnassignedTaskItem[] | null>(null)
  const [bulkResult, setBulkResult] = useState<{
    assigned: number
    skipped: number
    reason?: string
  } | null>(null)

  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      setBulkResult(null)
    }
  }, [open])

  const toggle = (taskId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === tasks.length ? new Set() : new Set(tasks.map((t) => t.taskId))
    )
  }

  const openBulkAssign = () => {
    const picked = tasks.filter((t) => selected.has(t.taskId))
    if (picked.length === 0) return
    setBulkResult(null)
    setAssignTarget(picked)
  }

  return (
    <>
      <DetailDrawer
        open={open}
        onClose={onClose}
        title="Unassigned Work"
        subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''} · sorted by due date`}
        footer={
          selected.size > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="solid" tone="primary" size="sm">
                  {selected.size}
                </Badge>
                <Typography variant="small" weight="medium">
                  selected
                </Typography>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={openBulkAssign}>
                  Assign owner
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="mb-3 flex items-center gap-2">
          <Checkbox
            size="sm"
            label="Select all"
            checked={selected.size === tasks.length && tasks.length > 0}
            indeterminate={selected.size > 0 && selected.size < tasks.length}
            onChange={toggleAll}
          />
        </div>

        {bulkResult ? (
          <div className="mb-3 border border-neutral-100 bg-neutral-50 px-3 py-2">
            <Typography variant="small" weight="medium">
              {bulkResult.assigned + bulkResult.skipped} tasks processed
            </Typography>
            <Typography variant="small" tone="muted">
              Assigned {bulkResult.assigned} · Skipped {bulkResult.skipped}
              {bulkResult.reason ? ` · ${bulkResult.reason}` : ''}
            </Typography>
          </div>
        ) : null}

        <ul className="divide-y divide-neutral-100">
          {tasks.map((task) => (
            <li key={task.taskId} className="flex items-start gap-3 py-3">
              <Checkbox
                size="sm"
                className="mt-0.5"
                checked={selected.has(task.taskId)}
                onChange={() => toggle(task.taskId)}
                aria-label={`Select ${task.code}`}
              />
              <div className="min-w-0 flex-1">
                <Typography variant="small" weight="medium" className="font-mono text-neutral-700">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkResult(null)
                  setAssignTarget([task])
                }}
              >
                Assign
              </Button>
            </li>
          ))}
        </ul>
      </DetailDrawer>

      <QuickAssignDrawer
        open={!!assignTarget}
        tasks={assignTarget ?? []}
        members={members}
        resources={resources}
        overAllocations={overAllocations}
        onClose={() => setAssignTarget(null)}
        onComplete={(result) => {
          setBulkResult(result)
          setSelected(new Set())
          setAssignTarget(null)
          onAssigned()
        }}
      />
    </>
  )
}

function QuickAssignDrawer({
  open,
  tasks,
  members,
  resources,
  overAllocations,
  onClose,
  onComplete,
}: {
  open: boolean
  tasks: UnassignedTaskItem[]
  members: WorkspaceMember[]
  resources: ResourceProfile[]
  overAllocations: OverAllocationItem[]
  onClose: () => void
  onComplete: (result: { assigned: number; skipped: number; reason?: string }) => void
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { assignTasks, submitting } = useQuickAssignTasks()

  useEffect(() => {
    if (open) setSelectedUserId(null)
  }, [open, tasks])

  const userIds = useMemo(() => {
    const fromMembers = members.map((m) => m.userId)
    const fromResources = resources.map((r) => r.linkedUserId).filter(Boolean) as string[]
    return [...new Set([...fromMembers, ...fromResources])]
  }, [members, resources])

  const { labelFor } = useResolveUsers(userIds)

  const overloadedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const row of overAllocations) {
      if (row.userId) ids.add(row.userId)
      if ((row.utilizationPercent ?? 0) >= 100 && row.userId) ids.add(row.userId)
    }
    return ids
  }, [overAllocations])

  const candidates = useMemo(() => {
    return userIds
      .map((userId) => {
        const resource = resources.find((r) => r.linkedUserId === userId)
        const over = overAllocations.find((o) => o.userId === userId)
        const util = over?.utilizationPercent
        return {
          userId,
          name: labelFor(userId),
          role: resource?.displayName ?? null,
          utilizationPercent: util ?? null,
          overloaded: overloadedIds.has(userId) || (util != null && util >= 100),
        }
      })
      .sort((a, b) => Number(a.overloaded) - Number(b.overloaded) || a.name.localeCompare(b.name))
      .slice(0, 12)
  }, [userIds, resources, overAllocations, overloadedIds, labelFor])

  const primary = tasks[0]
  const multi = tasks.length > 1

  const handleAssign = async () => {
    if (!selectedUserId || tasks.length === 0) return
    const result = await assignTasks(
      tasks.map((t) => ({ projectId: t.projectId, taskId: t.taskId })),
      selectedUserId
    )
    onComplete(result)
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Assign Task"
      subtitle={multi ? `${tasks.length} tasks selected` : primary?.title}
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
      {primary ? (
        <div className="mb-4 space-y-1 border-b border-neutral-100 pb-4">
          {!multi ? (
            <>
              <Typography variant="small" tone="muted">Task</Typography>
              <Typography weight="medium">{primary.title}</Typography>
              <Typography variant="small" tone="muted" className="mt-2">
                Project · {primary.projectName}
              </Typography>
              {primary.phaseName ? (
                <Typography variant="small" tone="muted">Phase · {primary.phaseName}</Typography>
              ) : null}
              {primary.estimateHours != null ? (
                <Typography variant="small" tone="muted">
                  Estimate · {primary.estimateHours} hours
                </Typography>
              ) : null}
            </>
          ) : (
            <ul className="space-y-1">
              {tasks.slice(0, 5).map((t) => (
                <li key={t.taskId}>
                  <Typography variant="small">{t.code} · {t.title}</Typography>
                </li>
              ))}
              {tasks.length > 5 ? (
                <Typography variant="small" tone="muted">+{tasks.length - 5} more</Typography>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}

      <Typography variant="small" weight="medium" className="mb-2">
        Suggested people
      </Typography>
      {candidates.length === 0 ? (
        <Typography variant="small" tone="muted">
          No workspace members available to suggest.
        </Typography>
      ) : (
        <ul className="space-y-2">
          {candidates.map((c) => (
            <li key={c.userId}>
              <button
                type="button"
                onClick={() => setSelectedUserId(c.userId)}
                className={cn(
                  'w-full border px-3 py-2 text-left',
                  selectedUserId === c.userId
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-200 hover:bg-neutral-50'
                )}
              >
                <Typography weight="medium">{c.name}</Typography>
                <Typography variant="small" tone="muted">
                  {c.utilizationPercent != null
                    ? `${Math.round(c.utilizationPercent)}% capacity`
                    : 'Capacity unavailable'}
                  {c.overloaded ? ' · Overloaded' : ' · Available'}
                </Typography>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Typography variant="small" tone="muted" className="mt-4">
        AI suggestions are not auto-applied. Confirm the assignee before saving.
      </Typography>
    </DetailDrawer>
  )
}
