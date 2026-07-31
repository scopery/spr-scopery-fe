'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Badge, Button, DataTable, PageSkeleton, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { useProject } from '../../../project/hooks/useProject'
import { useDecisions } from '../hooks/useDecisions'
import { CreateDecisionModal } from './CreateDecisionModal'
import { DecisionDetailDrawer } from './DecisionDetailDrawer'
import type { DecisionRecord } from '../../domain/model/decision'
import { decisionStatusLabel } from '../../domain/rules/decision.rules'

export function DecisionsView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<DecisionRecord | null>(null)

  const { project } = useProject(workspaceId, projectId)
  const { decisions, loading, error, forbidden, createDecision, refetch } = useDecisions(projectId)

  if (loading && decisions.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to decisions</Typography>
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
            Decisions
          </Typography>
          {project ? (
            <Typography variant="caption" tone="muted" className="mt-0.5">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New decision
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
          ariaLabel="Project decisions"
          rows={decisions}
          rowKey={(decision) => decision.id}
          emptyMessage="No decisions yet"
          columns={[
            { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
            {
              id: 'title',
              header: 'Title',
              cell: (decision) => (
                <button
                  type="button"
                  className="text-left font-medium hover:underline"
                  onClick={() => setSelected(decision)}
                >
                  {decision.title}
                </button>
              ),
            },
            {
              id: 'category',
              header: 'Category',
              accessor: (decision) => decision.category ?? '—',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (decision) => (
                <Badge tone={decision.status === 'DECIDED' ? 'success' : 'neutral'}>
                  {decisionStatusLabel(decision.status)}
                </Badge>
              ),
            },
            {
              id: 'decidedAt',
              header: 'Decided at',
              accessor: (decision) => decision.decidedAt ?? '—',
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (decision) => (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setSelected(decision)}
                >
                  Open
                </button>
              ),
            },
          ]}
        />
      </div>

      <CreateDecisionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await createDecision(body)
            toast.success('Decision created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <DecisionDetailDrawer
        projectId={projectId}
        decision={selected}
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
