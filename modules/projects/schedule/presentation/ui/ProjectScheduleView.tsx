'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, DataTable, PageSkeleton, Typography } from '@/shared/ui'
import { UserIdentity, useResolveUsers } from '@/modules/platform'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectTasks } from '../../../task/presentation/hooks/useProjectTasks'
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
  const { tasks } = useProjectTasks(projectId)
  const taskLabelById = useMemo(
    () => new Map(tasks.map((task) => [task.id, `${task.code} · ${task.title}`])),
    [tasks]
  )
  const assigneeIds = useMemo(
    () => currentTasks.flatMap((task) => (task.assigneeUserId ? [task.assigneeUserId] : [])),
    [currentTasks]
  )
  const { peopleById } = useResolveUsers(assigneeIds)

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
      <Card className="p-8 text-center">
        <Typography weight="medium">You don’t have access to the schedule</Typography>
      </Card>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Schedule"
      />

      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Schedule
          </Typography>
          {project ? (
            <Typography variant="caption" tone="muted" className="mt-0.5">
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

      <Typography as="h2" size="md" weight="semibold" className="mb-2">
        Runs
      </Typography>
      <div className="mb-8 border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Schedule runs"
          rows={runs}
          rowKey={(run) => run.id}
          emptyMessage="No schedule runs yet"
          columns={[
            {
              id: 'status',
              header: 'Status',
              cell: (run) => (
                <Badge tone={scheduleRunStatusTone(run.status)}>
                  {scheduleRunStatusLabel(run.status)}
                </Badge>
              ),
            },
            {
              id: 'window',
              header: 'Planning window',
              accessor: (run) => `${run.planningStartDate ?? '—'} → ${run.planningEndDate ?? '—'}`,
            },
            { id: 'started', header: 'Started', accessor: (run) => run.startedAt ?? '—' },
            { id: 'completed', header: 'Completed', accessor: (run) => run.completedAt ?? '—' },
            {
              id: 'error',
              header: 'Error',
              accessor: (run) => run.errorMessage ?? '—',
              cellClassName: 'text-error',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (run) =>
                canCancelScheduleRun(run) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="error"
                    onClick={() => void handleCancel(run.id)}
                  >
                    Cancel
                  </Button>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </div>

      <Typography as="h2" size="md" weight="semibold" className="mb-2">
        Current schedule tasks
      </Typography>
      <div className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Current schedule tasks"
          rows={currentSchedule ? currentTasks : []}
          rowKey={(task) => task.id}
          emptyMessage="No current schedule — run a schedule to see task assignments"
          columns={[
            {
              id: 'task',
              header: 'Task',
              kind: 'reference',
              accessor: (task) => taskLabelById.get(task.taskId) ?? '—',
            },
            {
              id: 'assignee',
              header: 'Assignee',
              kind: 'reference',
              cell: (task) =>
                task.assigneeUserId && peopleById[task.assigneeUserId] ? (
                  <UserIdentity
                    userId={task.assigneeUserId}
                    person={peopleById[task.assigneeUserId]}
                    size="xs"
                    compact
                  />
                ) : (
                  '—'
                ),
            },
            {
              id: 'window',
              header: 'Estimated window',
              accessor: (task) =>
                `${task.estimatedStartDate ?? '—'} → ${task.estimatedFinishDate ?? '—'}`,
            },
            { id: 'hours', header: 'Scheduled hours', accessor: 'scheduledHours' },
            { id: 'due', header: 'Due date', accessor: (task) => task.dueDate ?? '—' },
            {
              id: 'risk',
              header: 'Risk',
              cell: (task) => (
                <Badge tone={taskScheduleRiskTone(task.riskStatus)}>{task.riskStatus}</Badge>
              ),
            },
          ]}
        />
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
