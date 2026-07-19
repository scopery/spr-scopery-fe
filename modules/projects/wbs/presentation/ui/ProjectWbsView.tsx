'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button, PageSkeleton, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectPhases } from '../../../phase/presentation/hooks/useProjectPhases'
import { useProjectWbs } from '../hooks/useProjectWbs'
import { CreateWbsNodeModal } from './CreateWbsNodeModal'
import { WbsTreeRow } from './WbsTreeRow'
import type { WbsTreeNode } from '../../domain/model/wbs'

function collectIds(nodes: WbsTreeNode[]): string[] {
  const ids: string[] = []
  const walk = (list: WbsTreeNode[]) => {
    for (const n of list) {
      ids.push(n.id)
      if (n.children.length) walk(n.children)
    }
  }
  walk(nodes)
  return ids
}

export function ProjectWbsView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const { project } = useProject(workspaceId, projectId)
  const { phases } = useProjectPhases(projectId)
  const { tree, loading, forbidden, error, actingId, createNode, archiveNode } =
    useProjectWbs(projectId)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [parentNode, setParentNode] = useState<WbsTreeNode | null>(null)

  const phaseOptions = useMemo(
    () => phases.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    [phases]
  )

  useEffect(() => {
    if (tree.length > 0 && expanded.size === 0) {
      setExpanded(new Set(collectIds(tree)))
    }
  }, [tree, expanded.size])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading && tree.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to WBS</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="WBS"
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Work breakdown structure
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Hierarchical deliverables and work packages
          </Typography>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setParentNode(null)
            setCreateOpen(true)
          }}
          disabled={phaseOptions.length === 0}
        >
          Add node
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      {phaseOptions.length === 0 ? (
        <div className="mb-4 border border-amber-200 bg-amber-50 p-3">
          <Typography variant="small" className="text-amber-800">
            Create at least one project phase before adding WBS nodes.
          </Typography>
        </div>
      ) : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Node</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Path</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tree.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No WBS nodes yet
                  </Typography>
                </td>
              </tr>
            ) : (
              tree.map((node) => (
                <WbsTreeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggle}
                  onAddChild={(n) => {
                    setParentNode(n)
                    setCreateOpen(true)
                  }}
                  onArchive={(id) =>
                    void archiveNode(id).catch((e) => toast.error(getProblemToastMessage(e)))
                  }
                  actingId={actingId}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateWbsNodeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        phaseOptions={phaseOptions}
        defaultPhaseId={parentNode?.projectPhaseId ?? phases[0]?.id}
        parentId={parentNode?.id ?? null}
        parentTitle={parentNode?.title ?? null}
        onSubmit={async (body) => {
          try {
            await createNode(body)
            toast.success('WBS node created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
