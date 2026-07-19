'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
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
        <Typography weight="medium">You don't have access to milestones</Typography>
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
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

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Code / Name</th>
              <th className="px-4 py-3 font-medium">Target date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No milestones yet
                  </Typography>
                </td>
              </tr>
            ) : (
              milestones.map((m) => (
                <tr key={m.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Typography as="span" variant="small" tone="muted" className="font-mono">
                      {m.code}
                    </Typography>
                    <Typography as="div" weight="medium">
                      {m.name}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    <Typography variant="small">
                      {m.targetDate ?? '—'}
                    </Typography>
                    {isOverdueMilestone(m) && (
                      <Typography variant="small" className="text-red-600">
                        Overdue
                      </Typography>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={milestoneStatusTone(m.status)}>
                      {milestoneStatusLabel(m.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Stack direction="horizontal" spacing="sm">
                      {canAchieveMilestone(m) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actingId === m.id}
                          onClick={() => void handleAchieve(m.id)}
                        >
                          Achieve
                        </Button>
                      )}
                      {m.status !== 'ARCHIVED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          tone="error"
                          disabled={actingId === m.id}
                          onClick={() => void handleArchive(m.id)}
                        >
                          Archive
                        </Button>
                      )}
                    </Stack>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
