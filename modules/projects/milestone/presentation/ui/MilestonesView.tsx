'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, DataTable, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectMilestones } from '../hooks/useProjectMilestones'
import { CreateMilestoneModal } from './CreateMilestoneModal'
import {
  canAchieveMilestone,
  isOverdueMilestone,
  milestoneStatusLabel,
  milestoneStatusTone,
} from '../../domain/rules/milestone.rules'

export function MilestonesView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project } = useProject(workspaceId, projectId)
  const { milestones, loading, error, forbidden, createMilestone, achieve, archive } =
    useProjectMilestones(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const handleAchieve = async (milestoneId: string) => {
    setActingId(milestoneId)
    try {
      await achieve(milestoneId)
      toast.success('Milestone achieved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingId(null)
    }
  }

  const handleArchive = async (milestoneId: string) => {
    setActingId(milestoneId)
    try {
      await archive(milestoneId)
      toast.success('Milestone archived')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingId(null)
    }
  }

  if (loading && milestones.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to milestones</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Milestones"
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Milestones
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New milestone
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Project milestones"
          rows={milestones}
          rowKey={(milestone) => milestone.id}
          emptyMessage="No milestones yet"
          columns={[
            { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
            { id: 'name', header: 'Name', accessor: 'name' },
            {
              id: 'targetDate',
              header: 'Target date',
              cell: (milestone) => (
                <div>
                  <Typography variant="small">{milestone.targetDate ?? '—'}</Typography>
                  {isOverdueMilestone(milestone) ? (
                    <Typography variant="small" className="text-red-600">
                      Overdue
                    </Typography>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (milestone) => (
                <Badge tone={milestoneStatusTone(milestone.status)}>
                  {milestoneStatusLabel(milestone.status)}
                </Badge>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (milestone) => (
                <Stack direction="horizontal" spacing="sm">
                  {canAchieveMilestone(milestone) ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actingId === milestone.id}
                      onClick={() => void handleAchieve(milestone.id)}
                    >
                      Achieve
                    </Button>
                  ) : null}
                  {milestone.status !== 'ARCHIVED' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      tone="error"
                      disabled={actingId === milestone.id}
                      onClick={() => void handleArchive(milestone.id)}
                    >
                      Archive
                    </Button>
                  ) : null}
                </Stack>
              ),
            },
          ]}
        />
      </div>

      <CreateMilestoneModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await createMilestone(body)
            toast.success('Milestone created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
