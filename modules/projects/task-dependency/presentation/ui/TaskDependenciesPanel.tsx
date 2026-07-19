'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useTaskDependencies } from '../hooks/useTaskDependencies'
import { AddTaskDependencyModal } from './AddTaskDependencyModal'

interface TaskDependenciesPanelProps {
  projectId: string
  taskId: string
}

export function TaskDependenciesPanel({ projectId, taskId }: TaskDependenciesPanelProps) {
  const { deps, loading, createDep, removeDep } = useTaskDependencies(projectId, taskId)
  const [addOpen, setAddOpen] = useState(false)

  const handleRemove = async (depId: string) => {
    try {
      await removeDep(depId)
      toast.success('Dependency removed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

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
          No dependencies
        </Typography>
      ) : (
        <ul className="space-y-2">
          {deps.map((d) => {
            const isPredecessor = d.successorTaskId === taskId
            return (
              <li
                key={d.id}
                className="flex items-center justify-between border border-neutral-100 px-3 py-2"
              >
                <div>
                  <Stack direction="horizontal" spacing="sm" className="items-center">
                    <Badge tone={isPredecessor ? 'warning' : 'neutral'}>
                      {isPredecessor ? 'Depends on' : 'Blocks'}
                    </Badge>
                    <Typography variant="small" className="font-mono">
                      {isPredecessor
                        ? d.predecessorTaskId.slice(0, 8)
                        : d.successorTaskId.slice(0, 8)}
                      …
                    </Typography>
                    <Typography variant="small" tone="muted">
                      {d.dependencyType}
                    </Typography>
                  </Stack>
                  {d.lagDays != null && d.lagDays > 0 && (
                    <Typography variant="small" tone="muted">
                      Lag: {d.lagDays}d
                    </Typography>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  tone="error"
                  onClick={() => void handleRemove(d.id)}
                >
                  Remove
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <AddTaskDependencyModal
        open={addOpen}
        currentTaskId={taskId}
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
