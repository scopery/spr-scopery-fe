'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import * as catalogApi from '../api/functional-catalog.api'
import { useArchitectureNodeCatalog } from '../hooks/useArchitectureNodeCatalog'
import { useFunctionalAnchorCoverage } from '../hooks/useFunctionalAnchorCoverage'
import {
  ARCHITECTURE_NODE_TYPE_LABEL,
  type ArchitectureCatalogNode,
} from '../model/architecture-workbench'
import {
  ANCHOR_NODE_TYPE_TO_ARCHITECTURE,
  ARCHITECTURE_TO_ANCHOR_NODE_TYPE,
  labelArchitectureNode,
} from '../model/anchor-mapping'
import type { FunctionalItem } from '../model/functional-catalog'
import type { FunctionalItemAnchorNodeType } from '../model/functional-catalog'

type MapView = 'links' | 'fromFr' | 'fromNode'

interface FunctionalMappingPanelProps {
  workspaceId: string
  projectId: string
  functionalItems: FunctionalItem[]
  lockedApplicationId?: string | null
  onSelectFr?: (id: string | null) => void
}

interface LinkEdge {
  key: string
  functionalItemId: string
  frCode: string
  frTitle: string
  anchorId: string
  nodeType: string
  nodeId: string
  note?: string | null
  node?: ArchitectureCatalogNode | null
}

function nodeTypeLabel(nodeType: string): string {
  const arch = ANCHOR_NODE_TYPE_TO_ARCHITECTURE[nodeType as FunctionalItemAnchorNodeType]
  return arch ? ARCHITECTURE_NODE_TYPE_LABEL[arch] : nodeType
}

export function FunctionalMappingPanel({
  workspaceId,
  projectId,
  functionalItems,
  lockedApplicationId = null,
  onSelectFr,
}: FunctionalMappingPanelProps) {
  const [applicationId, setApplicationId] = useState(lockedApplicationId ?? '')
  const [view, setView] = useState<MapView>(lockedApplicationId ? 'fromNode' : 'links')
  const [selectedFrId, setSelectedFrId] = useState<string | null>(
    functionalItems[0]?.id ?? null
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [linkFrId, setLinkFrId] = useState(functionalItems[0]?.id ?? '')
  const [linkNodeId, setLinkNodeId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const effectiveAppId = lockedApplicationId || applicationId || null
  const { applications, nodes, nodeById, loading: nodesLoading } =
    useArchitectureNodeCatalog(workspaceId, effectiveAppId)
  const { rows, frWithoutAnchors, loading, error, refetch } =
    useFunctionalAnchorCoverage(projectId)

  useEffect(() => {
    if (lockedApplicationId) setApplicationId(lockedApplicationId)
  }, [lockedApplicationId])

  useEffect(() => {
    if (!linkFrId && functionalItems[0]?.id) setLinkFrId(functionalItems[0].id)
    if (
      selectedFrId &&
      !functionalItems.some((i) => i.id === selectedFrId) &&
      functionalItems[0]
    ) {
      setSelectedFrId(functionalItems[0].id)
    }
  }, [functionalItems, linkFrId, selectedFrId])

  const edges = useMemo<LinkEdge[]>(() => {
    const list: LinkEdge[] = []
    for (const row of rows) {
      for (const a of row.anchors) {
        list.push({
          key: a.id,
          functionalItemId: row.functionalItem.id,
          frCode: row.functionalItem.code,
          frTitle: row.functionalItem.title,
          anchorId: a.id,
          nodeType: a.nodeType,
          nodeId: a.nodeId,
          note: a.note,
          node: nodeById.get(a.nodeId) ?? null,
        })
      }
    }
    return list.sort((a, b) => a.frCode.localeCompare(b.frCode))
  }, [rows, nodeById])

  const edgesForFr = useMemo(
    () => edges.filter((e) => e.functionalItemId === selectedFrId),
    [edges, selectedFrId]
  )

  const edgesForNode = useMemo(
    () => edges.filter((e) => e.nodeId === selectedNodeId),
    [edges, selectedNodeId]
  )

  const linkedNodeIdsForFr = useMemo(
    () => new Set(edgesForFr.map((e) => e.nodeId)),
    [edgesForFr]
  )

  const frOptions = functionalItems.map((i) => ({
    value: i.id,
    label: `${i.code} — ${i.title}`,
  }))

  const nodeOptions = nodes.map((n) => ({
    value: n.id,
    label: `${ARCHITECTURE_NODE_TYPE_LABEL[n.type]} · ${labelArchitectureNode(n)}`,
  }))

  const attach = useCallback(async () => {
    if (!linkFrId || !linkNodeId) return
    const node = nodeById.get(linkNodeId)
    if (!node) return
    setSubmitting(true)
    setFormError(null)
    try {
      await catalogApi.addAnchor(projectId, linkFrId, {
        nodeType: ARCHITECTURE_TO_ANCHOR_NODE_TYPE[node.type],
        nodeId: node.id,
        note: null,
      })
      setLinkNodeId('')
      setSelectedFrId(linkFrId)
      onSelectFr?.(linkFrId)
      await refetch()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError('This link already exists.')
      } else {
        setFormError(err instanceof Error ? err.message : 'Failed to link')
      }
    } finally {
      setSubmitting(false)
    }
  }, [linkFrId, linkNodeId, nodeById, projectId, refetch, onSelectFr])

  const unlink = useCallback(
    async (edge: LinkEdge) => {
      setFormError(null)
      try {
        await catalogApi.removeAnchor(projectId, edge.functionalItemId, edge.anchorId)
        await refetch()
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Failed to unlink')
      }
    },
    [projectId, refetch]
  )

  const renderEdge = (edge: LinkEdge) => {
    const nodeLabel = edge.node
      ? labelArchitectureNode(edge.node)
      : edge.nodeId.slice(0, 8) + '…'
    return (
      <li
        key={edge.key}
        className="grid grid-cols-1 items-center gap-2 border-b border-neutral-100 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto]"
      >
        <button
          type="button"
          className="min-w-0 text-left hover:underline"
          onClick={() => {
            setView('fromFr')
            setSelectedFrId(edge.functionalItemId)
            setLinkFrId(edge.functionalItemId)
            onSelectFr?.(edge.functionalItemId)
          }}
        >
          <div className="truncate text-sm text-neutral-900">{edge.frCode}</div>
          <div className="truncate text-xs text-neutral-500">{edge.frTitle}</div>
        </button>
        <div className="hidden text-neutral-400 sm:block" aria-hidden>
          →
        </div>
        <button
          type="button"
          className="min-w-0 text-left"
          onClick={() => {
            setView('fromNode')
            setSelectedNodeId(edge.nodeId)
          }}
        >
          <div className="truncate text-sm text-neutral-900">
            {nodeTypeLabel(edge.nodeType)} · {nodeLabel}
          </div>
          {edge.note ? (
            <div className="truncate text-xs text-neutral-500">{edge.note}</div>
          ) : null}
        </button>
        <Button size="sm" variant="ghost" onClick={() => void unlink(edge)}>
          Unlink
        </Button>
      </li>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg">
      {/* Context + add link */}
      <div className="space-y-3 border-b border-neutral-200 pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Typography as="h2" size="md" weight="medium">
              Relationships
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              FR ↔ architecture node. {edges.length} link{edges.length === 1 ? '' : 's'}
              {frWithoutAnchors.length
                ? ` · ${frWithoutAnchors.length} FR with no link`
                : ''}
            </Typography>
          </div>
          {!lockedApplicationId ? (
            <div className="min-w-[220px]">
              <Select
                value={applicationId}
                onValueChange={(v: string) => {
                  setApplicationId(v)
                  setLinkNodeId('')
                  setSelectedNodeId(null)
                }}
                options={applications.map((a) => ({
                  value: a.id,
                  label: `${a.code} — ${a.name}`,
                }))}
                placeholder="Application"
              />
            </div>
          ) : null}
        </div>

        <div className="bg-neutral-50 p-3">
          <Typography variant="small" className="mb-2">
            Add link
          </Typography>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <Select
                value={linkFrId}
                onValueChange={setLinkFrId}
                options={frOptions}
                placeholder="Functional item"
              />
            </div>
            <span className="hidden text-neutral-400 lg:inline">→</span>
            <div className="min-w-0 flex-1">
              <Select
                value={linkNodeId}
                onValueChange={setLinkNodeId}
                options={nodeOptions}
                placeholder={
                  !effectiveAppId
                    ? 'Pick application first'
                    : nodesLoading
                      ? 'Loading nodes…'
                      : nodes.length
                        ? 'Architecture node'
                        : 'No nodes in this app'
                }
                disabled={!effectiveAppId || nodesLoading}
              />
            </div>
            <Button
              disabled={!linkFrId || !linkNodeId || submitting}
              onClick={() => void attach()}
            >
              Link
            </Button>
          </div>
          {formError ? (
            <Typography tone="error" variant="small" className="mt-2">
              {formError}
            </Typography>
          ) : null}
        </div>
      </div>

      {/* View switch */}
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Relationship views">
        {(
          [
            { id: 'links', label: 'All links' },
            { id: 'fromFr', label: 'From FR' },
            { id: 'fromNode', label: 'From node' },
          ] as const
        ).map((t) => {
          const active = view === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setView(t.id)}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {error ? <Typography tone="error">{error}</Typography> : null}
      {loading && edges.length === 0 ? (
        <Typography tone="muted">Loading relationships…</Typography>
      ) : null}

      {/* All links */}
      {view === 'links' ? (
        edges.length === 0 ? (
          <div className="py-10 text-center">
            <Typography>No links yet</Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              Select an FR and architecture node above, then click Link.
            </Typography>
          </div>
        ) : (
          <div className="max-h-[min(60vh,560px)] overflow-y-auto">
            <ul>
              <li className="sticky top-0 z-[1] mb-1 hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] gap-2 bg-white pb-1 text-xs text-neutral-500 sm:grid">
                <span>Functional item</span>
                <span />
                <span>Architecture node</span>
                <span />
              </li>
              {edges.map(renderEdge)}
            </ul>
          </div>
        )
      ) : null}

      {/* From FR */}
      {view === 'fromFr' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <Typography variant="caption" tone="muted" className="mb-2 block">
              Functional items
            </Typography>
            <ul className="max-h-[480px] space-y-0.5 overflow-auto">
              {functionalItems.map((item) => {
                const count =
                  rows.find((r) => r.functionalItem.id === item.id)?.anchors.length ?? 0
                const active = selectedFrId === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFrId(item.id)
                        setLinkFrId(item.id)
                        onSelectFr?.(item.id)
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm',
                        active ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
                      )}
                    >
                      <div className="truncate">{item.code}</div>
                      <div
                        className={cn(
                          'truncate text-xs',
                          active ? 'text-neutral-300' : 'text-neutral-500'
                        )}
                      >
                        {count === 0 ? 'Not linked' : `${count} node${count === 1 ? '' : 's'}`}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
          <main>
            {!selectedFrId ? (
              <Typography tone="muted">Select a functional item</Typography>
            ) : (
              <Stack direction="vertical" spacing="md">
                <Typography variant="small" tone="muted">
                  Nodes linked to this FR
                </Typography>
                {edgesForFr.length === 0 ? (
                  <Typography tone="muted">
                    No nodes linked yet. Use the Add link form above.
                  </Typography>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {edgesForFr.map((edge) => (
                      <li
                        key={edge.key}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm">
                            {nodeTypeLabel(edge.nodeType)} ·{' '}
                            {edge.node
                              ? labelArchitectureNode(edge.node)
                              : edge.nodeId.slice(0, 8) + '…'}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => void unlink(edge)}>
                          Unlink
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {nodes.length > 0 ? (
                  <div>
                    <Typography variant="caption" tone="muted" className="mb-2 block">
                      Nodes in this app (linked ones are marked)
                    </Typography>
                    <ul className="max-h-56 overflow-auto text-sm">
                      {nodes.map((n) => {
                        const linked = linkedNodeIdsForFr.has(n.id)
                        return (
                          <li
                            key={n.id}
                            className={cn(
                              'flex items-center justify-between gap-2 border-b border-neutral-50 py-1.5',
                              linked && 'bg-neutral-50'
                            )}
                          >
                            <span className="truncate">
                              {ARCHITECTURE_NODE_TYPE_LABEL[n.type]} · {n.code} — {n.name}
                            </span>
                            {linked ? (
                              <span className="shrink-0 text-xs text-neutral-500">linked</span>
                            ) : (
                              <button
                                type="button"
                                className="shrink-0 text-xs underline"
                                onClick={() => {
                                  setLinkFrId(selectedFrId)
                                  setLinkNodeId(n.id)
                                }}
                              >
                                Link
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}
              </Stack>
            )}
          </main>
        </div>
      ) : null}

      {/* From node */}
      {view === 'fromNode' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside>
            <Typography variant="caption" tone="muted" className="mb-2 block">
              Architecture nodes
            </Typography>
            {!effectiveAppId ? (
              <Typography tone="muted" variant="small">
                Select an application first
              </Typography>
            ) : (
              <ul className="max-h-[min(60vh,560px)] space-y-0.5 overflow-auto">
                {nodes.map((n) => {
                  const count = edges.filter((e) => e.nodeId === n.id).length
                  const active = selectedNodeId === n.id
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedNodeId(n.id)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm',
                          active ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
                        )}
                      >
                        <div className="truncate">
                          {n.code} — {n.name}
                        </div>
                        <div
                          className={cn(
                            'truncate text-xs',
                            active ? 'text-neutral-300' : 'text-neutral-500'
                          )}
                        >
                          {ARCHITECTURE_NODE_TYPE_LABEL[n.type]}
                          {count ? ` · ${count} FR` : ' · no FR yet'}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </aside>
          <main>
            {!selectedNodeId ? (
              <Typography tone="muted">Select an architecture node</Typography>
            ) : edgesForNode.length === 0 ? (
              <Typography tone="muted">
                No FR linked to this node yet. Use the Add link form above.
              </Typography>
            ) : (
              <div>
                <Typography variant="small" tone="muted" className="mb-3">
                  {edgesForNode.length} functional item
                  {edgesForNode.length === 1 ? '' : 's'} linked — click to open
                </Typography>
                <ul className="max-h-[min(60vh,560px)] divide-y divide-neutral-100 overflow-y-auto">
                  {edgesForNode.map((edge) => (
                    <li key={edge.key} className="flex items-center justify-between gap-3 py-2.5">
                      <Link
                        href={`${ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId)}?fr=${edge.functionalItemId}`}
                        className="min-w-0 flex-1 hover:underline"
                      >
                        <div className="truncate text-sm text-neutral-900">
                          {edge.frCode}
                        </div>
                        <div className="truncate text-xs text-neutral-500">{edge.frTitle}</div>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => void unlink(edge)}>
                        Unlink
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </main>
        </div>
      ) : null}
    </Stack>
  )
}
