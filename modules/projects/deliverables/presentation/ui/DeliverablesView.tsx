'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, PageSkeleton, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
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
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        className="mb-1"
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Deliverables
          </Typography>
          {project ? (
            <Typography variant="caption" tone="muted" className="mt-0.5">
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

      <div className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Project deliverables"
          rows={deliverables}
          rowKey={(deliverable) => deliverable.id}
          emptyMessage="No deliverables yet"
          columns={[
            { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
            {
              id: 'title',
              header: 'Title',
              cell: (deliverable) => (
                <button
                  type="button"
                  className="text-left font-medium hover:underline"
                  onClick={() => setSelected(deliverable)}
                >
                  {deliverable.title}
                </button>
              ),
            },
            { id: 'type', header: 'Type', accessor: 'type' },
            {
              id: 'status',
              header: 'Status',
              cell: (deliverable) => (
                <Badge tone={deliverable.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                  {deliverableStatusLabel(deliverable.status)}
                </Badge>
              ),
            },
            {
              id: 'acceptance',
              header: 'Acceptance',
              accessor: (deliverable) =>
                deliverable.acceptanceRequired ? 'Required' : 'Not required',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (deliverable) => (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setSelected(deliverable)}
                >
                  Open
                </button>
              ),
            },
          ]}
        />
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
