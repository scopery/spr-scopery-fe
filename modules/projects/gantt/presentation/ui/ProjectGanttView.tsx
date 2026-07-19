'use client'

import { useParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectGantt } from '../hooks/useProjectGantt'
import { GanttBarRow } from './GanttBarRow'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export function ProjectGanttView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project } = useProject(workspaceId, projectId)
  const { tree, dateRange, summary, loading, recalculating, error, forbidden, recalculate } =
    useProjectGantt(projectId, { includeUnscheduled: true })

  const handleRecalculate = async () => {
    try {
      await recalculate({ markAsCurrent: true })
      toast.success('Schedule recalculated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && tree.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to the Gantt timeline</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Timeline"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Timeline
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} />}
          loading={recalculating}
          onClick={() => void handleRecalculate()}
        >
          Recalculate
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      {summary ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="neutral">{summary.itemCount} items</Badge>
          <Badge tone="success">{summary.scheduledTaskCount} scheduled</Badge>
          <Badge tone="warning">{summary.unscheduledTaskCount} unscheduled</Badge>
          <Badge tone="info">{summary.milestoneCount} milestones</Badge>
          {summary.issueCount > 0 ? <Badge tone="error">{summary.issueCount} issues</Badge> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        {dateRange ? (
          <div className="grid grid-cols-[minmax(0,280px)_1fr] gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2">
            <Typography as="span" size="xs" tone="muted">
              Item
            </Typography>
            <div className="flex justify-between">
              <Typography as="span" size="xs" tone="muted">
                {formatDate(new Date(dateRange.startMs).toISOString())}
              </Typography>
              <Typography as="span" size="xs" tone="muted">
                {formatDate(new Date(dateRange.endMs).toISOString())}
              </Typography>
            </div>
          </div>
        ) : (
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
            <Typography as="span" size="xs" tone="muted">
              Timeline
            </Typography>
          </div>
        )}

        {tree.length === 0 || !dateRange ? (
          <div className="px-4 py-8 text-center">
            <Typography variant="small" tone="muted">
              No scheduled items yet — run a schedule to populate the timeline
            </Typography>
          </div>
        ) : (
          tree.map((item) => <GanttBarRow key={item.id} item={item} depth={0} range={dateRange} />)
        )}
      </div>
    </div>
  )
}
