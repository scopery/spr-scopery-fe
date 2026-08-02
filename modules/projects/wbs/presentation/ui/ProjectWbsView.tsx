'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, DataTable, PageSkeleton, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectPhases } from '../../../phase/presentation/hooks/useProjectPhases'
import { useProjectWbs } from '../hooks/useProjectWbs'
import { CreateWbsNodeModal } from './CreateWbsNodeModal'
import { WbsAddBar } from './WbsAddBar'
import type { WbsTreeNode } from '../../domain/model/wbs'
import { canArchiveWbsNode, wbsNodeStatusLabel } from '../../domain/rules/wbs.rules'
import { WbsNodeTypeBadge } from './WbsNodeTypeBadge'

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
  const {
    tree,
    loading,
    forbidden,
    error,
    actingId,
    createNode,
    submitWbsNodesBulk,
    archiveNode,
    refetch,
  } = useProjectWbs(projectId)

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
  const visibleNodes = useMemo(() => {
    const result: Array<{ node: WbsTreeNode; depth: number }> = []
    const walk = (nodes: WbsTreeNode[], depth: number) => {
      nodes.forEach((node) => {
        result.push({ node, depth })
        if (node.children.length > 0 && expanded.has(node.id)) walk(node.children, depth + 1)
      })
    }
    walk(tree, 0)
    return result
  }, [tree, expanded])

  if (loading && tree.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to Plan Structure</Typography>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Plan Structure"
      />
      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Plan Structure
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            Organize work into planning elements under each phase
          </Typography>
        </div>
        <WbsAddBar
          phaseOptions={phaseOptions}
          defaultPhaseId={phases[0]?.id ?? null}
          parentId={null}
          parentTitle={null}
          disabled={phaseOptions.length === 0}
          onCreate={async (body) => {
            try {
              await createNode(body)
              toast.success('Planning element created')
            } catch (err) {
              toast.error(getProblemToastMessage(err))
              throw err
            }
          }}
          onSubmitBulk={submitWbsNodesBulk}
          onBatchComplete={async () => {
            await refetch()
          }}
        />
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
            Create at least one project phase before adding planning elements.
          </Typography>
        </div>
      ) : null}

      <div className="border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Plan Structure"
          rows={visibleNodes}
          rowKey={({ node }) => node.id}
          emptyMessage="No planning elements yet"
          columns={[
            {
              id: 'node',
              header: 'Element',
              cell: ({ node, depth }) => {
                const hasChildren = node.children.length > 0
                const isExpanded = expanded.has(node.id)
                return (
                  <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
                    {hasChildren ? (
                      <button
                        type="button"
                        className="text-neutral-500 hover:text-neutral-900"
                        onClick={() => toggle(node.id)}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    ) : (
                      <span className="inline-block w-3.5" />
                    )}
                    <span className="font-normal text-neutral-600">{node.code}</span>
                    <Typography as="span" weight="medium">
                      {node.title}
                    </Typography>
                  </div>
                )
              },
              kind: 'code',
            },
            {
              id: 'type',
              header: 'Type',
              cell: ({ node }) => <WbsNodeTypeBadge nodeType={node.nodeType} />,
            },
            {
              id: 'status',
              header: 'Status',
              cell: ({ node }) => (
                <Badge tone={node.status === 'ARCHIVED' ? 'neutral' : 'success'}>
                  {wbsNodeStatusLabel(node.status)}
                </Badge>
              ),
            },
            { id: 'path', header: 'Path', accessor: ({ node }) => node.path },
            {
              id: 'actions',
              header: 'Actions',
              cell: ({ node }) => (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Plus size={14} />}
                    disabled={actingId === node.id}
                    onClick={() => {
                      setParentNode(node)
                      setCreateOpen(true)
                    }}
                  >
                    Add child element
                  </Button>
                  {canArchiveWbsNode(node) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      tone="error"
                      disabled={actingId === node.id}
                      onClick={() =>
                        void archiveNode(node.id).catch((error) =>
                          toast.error(getProblemToastMessage(error))
                        )
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Child-row "Add child" still uses the single-create modal. */}
      <CreateWbsNodeModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setParentNode(null)
        }}
        phaseOptions={phaseOptions}
        defaultPhaseId={parentNode?.projectPhaseId ?? phases[0]?.id}
        parentId={parentNode?.id ?? null}
        parentTitle={parentNode?.title ?? null}
        onSubmit={async (body) => {
          try {
            await createNode(body)
            toast.success('Planning element created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
