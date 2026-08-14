'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, ConfirmDialog, DataTable, PageSkeleton, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectPhases } from '../../../phase/presentation/hooks/useProjectPhases'
import { useProjectWbs } from '../hooks/useProjectWbs'
import { CreateWbsNodeModal } from './CreateWbsNodeModal'
import { WbsAddBar } from './WbsAddBar'
import { WbsNodeDetailDrawer } from './WbsNodeDetailDrawer'
import type { WbsTreeNode } from '../../domain/model/wbs'
import {
  canDeleteWbsNode,
  findWbsNodeInTree,
  groupWbsTreeByPhase,
  wbsNodeStatusLabel,
} from '../../domain/rules/wbs.rules'
import { WbsNodeTypeBadge } from './WbsNodeTypeBadge'

const EXPAND_STORAGE_PREFIX = 'scopery.plan-structure.expanded.'
const SCROLL_STORAGE_PREFIX = 'scopery.plan-structure.scroll.'

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

function readExpanded(projectId: string): Set<string> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${EXPAND_STORAGE_PREFIX}${projectId}`)
    if (!raw) return null
    const ids = JSON.parse(raw) as string[]
    return new Set(ids)
  } catch {
    return null
  }
}

function PlanStructureContent() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const listScrollRef = useRef<HTMLDivElement>(null)
  const expandedReady = useRef(false)

  const queryNodeId = searchParams.get('node')
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
    updateNode,
    archiveNode,
    deleteNode,
    refetch,
  } = useProjectWbs(projectId)

  const [expanded, setExpanded] = useState<Set<string>>(() => readExpanded(projectId) ?? new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [parentNode, setParentNode] = useState<WbsTreeNode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WbsTreeNode | null>(null)
  const [deleting, setDeleting] = useState(false)

  const phaseOptions = useMemo(
    () => phases.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    [phases]
  )
  const phaseNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of phases) map.set(p.id, `${p.code} — ${p.name}`)
    return map
  }, [phases])

  const groups = useMemo(
    () => groupWbsTreeByPhase(tree, phases.map((p) => ({ id: p.id }))),
    [tree, phases]
  )

  const selectedNode = useMemo(
    () => (queryNodeId ? findWbsNodeInTree(tree, queryNodeId) : null),
    [tree, queryNodeId]
  )

  useEffect(() => {
    if (expandedReady.current) return
    if (tree.length === 0) return
    expandedReady.current = true
    if (expanded.size > 0) return
    setExpanded(new Set(collectIds(tree)))
  }, [tree, expanded.size])

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `${EXPAND_STORAGE_PREFIX}${projectId}`,
        JSON.stringify([...expanded])
      )
    } catch {
      /* ignore */
    }
  }, [projectId, expanded])

  useEffect(() => {
    const el = listScrollRef.current
    if (!el) return
    const key = `${SCROLL_STORAGE_PREFIX}${projectId}`
    const saved = sessionStorage.getItem(key)
    if (saved) el.scrollTop = Number(saved) || 0
    const onScroll = () => sessionStorage.setItem(key, String(el.scrollTop))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [projectId])

  const structureHref = useCallback(
    (nodeId: string | null) => {
      const next = new URLSearchParams()
      if (nodeId) next.set('node', nodeId)
      const qs = next.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [pathname]
  )

  const openNode = (nodeId: string) => {
    router.replace(structureHref(nodeId), { scroll: false })
  }

  const closeNode = () => {
    router.replace(structureHref(null), { scroll: false })
  }

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const flattenGroup = (roots: WbsTreeNode[]) => {
    const result: Array<{ node: WbsTreeNode; depth: number }> = []
    const walk = (nodes: WbsTreeNode[], depth: number) => {
      nodes.forEach((node) => {
        result.push({ node, depth })
        if (node.children.length > 0 && expanded.has(node.id)) walk(node.children, depth + 1)
      })
    }
    walk(roots, 0)
    return result
  }

  if (loading && tree.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to Plan Structure</Typography>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Plan Structure"
      />
      <div className="mb-2 mt-1 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
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
            await refetch({ silent: true })
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

      <div
        ref={listScrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto"
      >
        {groups.map((group) => {
          const isUnassigned = group.phaseId == null
          if (isUnassigned && group.roots.length === 0) return null
          const rows = flattenGroup(group.roots)
          const phaseTitle = isUnassigned
            ? 'No phase'
            : (phaseNameById.get(group.phaseId!) ?? 'Unknown phase')
          return (
            <section
              key={group.phaseId ?? 'unassigned'}
              className="overflow-hidden border border-neutral-300 bg-white"
            >
              <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                <Typography weight="medium" size="sm">
                  {phaseTitle}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {isUnassigned
                    ? 'Elements created without a phase. Phase cannot be changed after create — recreate under a phase to assign one.'
                    : `${rows.length} element${rows.length === 1 ? '' : 's'}`}
                </Typography>
              </div>

              {rows.length === 0 ? (
                <Typography variant="small" tone="muted" className="px-3 py-6 text-center">
                  No planning elements in this phase yet.
                </Typography>
              ) : (
                <DataTable
                  ariaLabel={phaseTitle}
                  rows={rows}
                  rowKey={({ node }) => node.id}
                  selectedRowKey={queryNodeId}
                  onRowClick={({ node }) => openNode(node.id)}
                  emptyMessage="No planning elements yet"
                  columns={[
                    {
                      id: 'node',
                      header: 'Element',
                      align: 'left',
                      truncate: false,
                      width: '52%',
                      headerClassName: 'text-left',
                      cellClassName: 'text-left',
                      cell: ({ node, depth }) => {
                        const hasChildren = node.children.length > 0
                        const isExpanded = expanded.has(node.id)
                        return (
                          <div
                            className="flex w-full min-w-0 items-center justify-start gap-1.5 text-left"
                            style={{ paddingLeft: depth * 20 }}
                          >
                            {hasChildren ? (
                              <button
                                type="button"
                                className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-900"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggle(node.id)
                                }}
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="min-w-0 truncate font-normal text-neutral-600">
                              {node.code}
                            </span>
                            <Typography as="span" weight="medium" className="min-w-0 truncate">
                              {node.title}
                            </Typography>
                          </div>
                        )
                      },
                    },
                    {
                      id: 'type',
                      header: 'Type',
                      align: 'left',
                      width: '18%',
                      cell: ({ node }) => <WbsNodeTypeBadge nodeType={node.nodeType} />,
                    },
                    {
                      id: 'status',
                      header: 'Status',
                      align: 'left',
                      width: '16%',
                      cell: ({ node }) => (
                        <Badge tone={node.status === 'ARCHIVED' ? 'neutral' : 'success'}>
                          {wbsNodeStatusLabel(node.status)}
                        </Badge>
                      ),
                    },
                    {
                      id: 'actions',
                      header: 'Actions',
                      align: 'left',
                      width: '14%',
                      interactive: true,
                      cell: ({ node }) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          iconOnly
                          icon={<Plus size={16} />}
                          aria-label="Add child"
                          title="Add child"
                          disabled={actingId === node.id || !node.projectPhaseId}
                          onClick={() => {
                            setParentNode(node)
                            setCreateOpen(true)
                          }}
                        />
                      ),
                    },
                  ]}
                />
              )}
            </section>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        variant="danger"
        title="Delete planning element"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone. The element must have no child elements or linked tasks.`}
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          setDeleting(true)
          try {
            await deleteNode(deleteTarget.id)
            toast.success('Planning element deleted')
            if (queryNodeId === deleteTarget.id) closeNode()
            setDeleteTarget(null)
          } catch (err) {
            toast.error(getProblemToastMessage(err))
          } finally {
            setDeleting(false)
          }
        }}
      />

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

      <WbsNodeDetailDrawer
        node={selectedNode}
        open={!!queryNodeId}
        acting={actingId === selectedNode?.id}
        phaseLabel={
          selectedNode?.projectPhaseId
            ? phaseNameById.get(selectedNode.projectPhaseId) ?? null
            : null
        }
        onClose={closeNode}
        onSave={async (id, body) => {
          try {
            await updateNode(id, body)
            toast.success('Saved')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
        onArchive={async (id) => {
          try {
            await archiveNode(id)
            toast.success('Archived')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
          }
        }}
        onDelete={async (id) => {
          const node = findWbsNodeInTree(tree, id)
          if (!node || !canDeleteWbsNode(node)) return
          setDeleteTarget(node)
        }}
      />
    </div>
  )
}

export function ProjectWbsView() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" />}>
      <PlanStructureContent />
    </Suspense>
  )
}
