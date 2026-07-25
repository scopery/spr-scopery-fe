'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { listTasks } from '../../../task/infrastructure/api/tasks.api'
import type { ProjectTask } from '../../../task/domain/model/task'
import type { TaskDependency } from '../../domain/model/task-dependency'
import { useTaskDependencies } from '../hooks/useTaskDependencies'
import { AddTaskDependencyModal } from './AddTaskDependencyModal'

function naturalRuleLabel(depType: string, waiting: boolean): string {
  if (waiting) {
    switch (depType) {
      case 'START_TO_START':
        return 'Must start before this task can start'
      case 'FINISH_TO_FINISH':
        return 'Must finish before this task can finish'
      case 'START_TO_FINISH':
        return 'Must start before this task can finish'
      default:
        return 'Must finish before this task can start'
    }
  }
  switch (depType) {
    case 'START_TO_START':
      return 'Can start after this task starts'
    case 'FINISH_TO_FINISH':
      return 'Can finish after this task finishes'
    case 'START_TO_FINISH':
      return 'Can finish after this task starts'
    default:
      return 'Can start after this task finishes'
  }
}

function timingLabel(lagDays: number | null | undefined): string | null {
  if (lagDays == null || lagDays === 0) return null
  if (lagDays > 0) {
    return `${lagDays}-day delay`
  }
  return `${Math.abs(lagDays)}-day overlap`
}

interface TaskDependenciesPanelProps {
  projectId: string
  taskId: string
  currentTaskTitle?: string
}

export function TaskDependenciesPanel({
  projectId,
  taskId,
  currentTaskTitle,
}: TaskDependenciesPanelProps) {
  const { deps, loading, createDep, removeDep } = useTaskDependencies(projectId, taskId)
  const [addOpen, setAddOpen] = useState(false)
  const [taskMap, setTaskMap] = useState<Record<string, ProjectTask>>({})

  useEffect(() => {
    listTasks(projectId, { size: 200 })
      .then((res) => {
        const map: Record<string, ProjectTask> = {}
        for (const t of res.items ?? []) map[t.id] = t
        setTaskMap(map)
      })
      .catch(() => {})
  }, [projectId])

  const handleRemove = async (depId: string) => {
    try {
      await removeDep(depId)
      toast.success('Dependency removed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const taskLabel = (id: string) => {
    const t = taskMap[id]
    if (!t) return id.slice(0, 8) + '…'
    return t.code ? `${t.code} · ${t.title}` : t.title
  }

  const resolvedTitle =
    currentTaskTitle?.trim() || taskMap[taskId]?.title || 'This task'

  const { waitingFor, blocking } = useMemo(() => {
    const waiting: TaskDependency[] = []
    const blocks: TaskDependency[] = []
    for (const d of deps) {
      if (d.successorTaskId === taskId) waiting.push(d)
      else if (d.predecessorTaskId === taskId) blocks.push(d)
    }
    return { waitingFor: waiting, blocking: blocks }
  }, [deps, taskId])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Typography weight="semibold">Dependencies</Typography>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          onClick={() => setAddOpen(true)}
        >
          Add
        </Button>
      </div>

      {loading ? (
        <Typography variant="small" tone="muted">
          Loading…
        </Typography>
      ) : deps.length === 0 ? (
        <Typography variant="small" tone="muted">
          No dependencies yet — add what this task is waiting for or blocking.
        </Typography>
      ) : (
        <div className="space-y-4">
          <DependencyGroup
            title="Waiting for"
            empty="Not waiting on any task"
            items={waitingFor}
            otherTaskId={(d) => d.predecessorTaskId}
            taskLabel={taskLabel}
            waiting
            onRemove={handleRemove}
          />
          <DependencyGroup
            title="Blocking"
            empty="Not blocking any task"
            items={blocking}
            otherTaskId={(d) => d.successorTaskId}
            taskLabel={taskLabel}
            waiting={false}
            onRemove={handleRemove}
          />
        </div>
      )}

      <AddTaskDependencyModal
        open={addOpen}
        projectId={projectId}
        currentTaskId={taskId}
        currentTaskTitle={resolvedTitle}
        existingDeps={deps}
        onClose={() => setAddOpen(false)}
        onSubmit={async (body) => {
          try {
            await createDep(body)
            toast.success('Dependency added')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}

function DependencyGroup({
  title,
  empty,
  items,
  otherTaskId,
  taskLabel,
  waiting,
  onRemove,
}: {
  title: string
  empty: string
  items: TaskDependency[]
  otherTaskId: (d: TaskDependency) => string
  taskLabel: (id: string) => string
  waiting: boolean
  onRemove: (id: string) => Promise<void>
}) {
  return (
    <div>
      <Typography variant="small" weight="medium" className="mb-2 text-neutral-700">
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="caption" tone="muted">
          {empty}
        </Typography>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => {
            const timing = timingLabel(d.lagDays)
            return (
              <li
                key={d.id}
                className="flex items-start justify-between gap-2 rounded border border-neutral-100 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Typography variant="small" weight="medium" className="truncate">
                    {taskLabel(otherTaskId(d))}
                  </Typography>
                  <Typography variant="caption" tone="muted" className="mt-0.5 block">
                    {naturalRuleLabel(d.dependencyType, waiting)}
                    {timing ? ` · ${timing}` : ''}
                  </Typography>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  tone="error"
                  onClick={() => void onRemove(d.id)}
                >
                  Remove
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
