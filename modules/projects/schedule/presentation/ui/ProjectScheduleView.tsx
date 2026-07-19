'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectSchedule } from '../hooks/useProjectSchedule'
import { CreateScheduleRunModal } from './CreateScheduleRunModal'
import {
  canCancelScheduleRun,
  scheduleRunStatusLabel,
  scheduleRunStatusTone,
  taskScheduleRiskTone,
} from '../../domain/rules/schedule.rules'

export function ProjectScheduleView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const [createOpen, setCreateOpen] = useState(false)

  const { project } = useProject(workspaceId, projectId)
  const {
    runs,
    currentSchedule,
    currentTasks,
    loading,
    creating,
    error,
    forbidden,
    createRun,
    cancelRun,
  } = useProjectSchedule(projectId)

  const handleCancel = async (scheduleRunId: string) => {
    try {
      await cancelRun(scheduleRunId)
      toast.success('Schedule run cancelled')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && runs.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to the schedule</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Schedule"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Schedule
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          loading={creating}
          onClick={() => setCreateOpen(true)}
        >
          New schedule run
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <Typography as="h2" size="lg" weight="semibold" className="mb-3">
        Runs
      </Typography>
      <div className="mb-8 overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Planning window</th>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium">Completed</th>
              <th className="px-4 py-3 font-medium">Error</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No schedule runs yet
                  </Typography>
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Badge tone={scheduleRunStatusTone(run.status)}>
                      {scheduleRunStatusLabel(run.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="muted">
                      {run.planningStartDate ?? '—'} → {run.planningEndDate ?? '—'}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="muted">
                      {run.startedAt ?? '—'}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="muted">
                      {run.completedAt ?? '—'}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="error">
                      {run.errorMessage ?? '—'}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    {canCancelScheduleRun(run) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        tone="error"
                        onClick={() => void handleCancel(run.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Typography as="h2" size="lg" weight="semibold" className="mb-3">
        Current schedule tasks
      </Typography>
      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Estimated window</th>
              <th className="px-4 py-3 font-medium">Scheduled hours</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {!currentSchedule || currentTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No current schedule — run a schedule to see task assignments
                  </Typography>
                </td>
              </tr>
            ) : (
              currentTasks.map((task) => (
                <tr key={task.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Typography as="span" variant="small" tone="muted" className="font-mono">
                      {task.taskId}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="muted">
                      {task.assigneeUserId ?? '—'}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="muted">
                      {task.estimatedStartDate ?? '—'} → {task.estimatedFinishDate ?? '—'}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="muted">
                      {task.scheduledHours}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="muted">
                      {task.dueDate ?? '—'}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={taskScheduleRiskTone(task.riskStatus)}>{task.riskStatus}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateScheduleRunModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await createRun(body)
            toast.success('Schedule run started')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
