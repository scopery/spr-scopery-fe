'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Badge, Button, PageSkeleton, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '../../../project/hooks/useProject'
import { useDeliverables } from '../hooks/useDeliverables'
import { CreateDeliverableModal } from './CreateDeliverableModal'
import { DeliverableDetailDrawer } from './DeliverableDetailDrawer'
import type { Deliverable } from '../../domain/model/deliverable'
import { deliverableStatusLabel } from '../../domain/rules/deliverable.rules'

export function DeliverablesView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Deliverable | null>(null)

  const { project } = useProject(workspaceId, projectId)
  const { deliverables, loading, error, forbidden, createDeliverable, refetch } =
    useDeliverables(projectId)

  if (loading && deliverables.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to deliverables</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        className="mb-4"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Deliverables
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New deliverable
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
              <th className="px-4 py-3 font-medium">Code / Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Acceptance</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliverables.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No deliverables yet
                  </Typography>
                </td>
              </tr>
            ) : (
              deliverables.map((d) => (
                <tr key={d.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => setSelected(d)}
                    >
                      <Typography as="span" variant="small" tone="muted" className="font-mono">
                        {d.code}
                      </Typography>
                      <Typography as="div" weight="medium">
                        {d.title}
                      </Typography>
                    </button>
                  </td>
                  <td className="px-4 py-3">{d.type}</td>
                  <td className="px-4 py-3">
                    <Badge tone={d.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                      {deliverableStatusLabel(d.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{d.acceptanceRequired ? 'Required' : 'Not required'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => setSelected(d)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateDeliverableModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await createDeliverable(body)
            toast.success('Deliverable created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <DeliverableDetailDrawer
        projectId={projectId}
        deliverable={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onUpdated={(updated) => {
          setSelected(updated)
          void refetch()
        }}
      />
    </div>
  )
}
