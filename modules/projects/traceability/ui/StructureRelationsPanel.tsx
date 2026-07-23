'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import { Typography } from '@/shared/ui'
import {
  useStructureRelations,
  type BulkLinkResult,
} from '../hooks/useStructureRelations'
import type { ArchitectureCatalogNode } from '../model/architecture-workbench'
import {
  StructureRelationType,
  type StructureRelation,
} from '../model/structure-relation'
import {
  buildBulkPlan,
  partitionRelationsForFocus,
  type BulkPlan,
  type RelationDirection,
} from '../model/structure-relation.rules'
import { ArchitectureNodePalette, type RelationDragMode } from './ArchitectureNodePalette'
import { BulkRelationPreviewDialog } from './BulkRelationPreviewDialog'
import { BulkRelationResultDialog } from './BulkRelationResultDialog'
import { RelationDropWorkspace } from './RelationDropWorkspace'
import { RelationGuideHint } from './RelationGuideHint'
import { RelationInspector } from './RelationInspector'

interface StructureRelationsPanelProps {
  workspaceId: string
  applicationId: string
  nodes: ArchitectureCatalogNode[]
  focusNodeId?: string | null
}

const UNDO_MS = 7000

export function StructureRelationsPanel({
  workspaceId,
  applicationId,
  nodes,
  focusNodeId = null,
}: StructureRelationsPanelProps) {
  const {
    items,
    loading,
    error,
    isLinking,
    isRemoving,
    create,
    linkRelations,
    remove,
    removeRelations,
    restore,
  } = useStructureRelations(workspaceId, applicationId)

  const [focusId, setFocusId] = useState<string | null>(focusNodeId)
  const [focusHistory, setFocusHistory] = useState<ArchitectureCatalogNode[]>([])
  const [direction, setDirection] = useState<RelationDirection>('focus-as-from')
  const [activeRelationType, setActiveRelationType] = useState<string>(
    StructureRelationType.Uses
  )
  const [dragMode, setDragMode] = useState<RelationDragMode>('single')
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [bulkSourceIds, setBulkSourceIds] = useState<string[]>([])
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null)
  const [selectedRelationIds, setSelectedRelationIds] = useState<Set<string>>(new Set())
  const [dropError, setDropError] = useState<string | null>(null)
  const [bulkPlan, setBulkPlan] = useState<BulkPlan | null>(null)
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkLinkResult | null>(null)
  const [bulkResultOpen, setBulkResultOpen] = useState(false)

  useEffect(() => {
    if (focusNodeId) setFocusId(focusNodeId)
  }, [focusNodeId])

  useEffect(() => {
    if (selectedNodeIds.size > 1) setDragMode('bulk')
  }, [selectedNodeIds.size])

  const nodeById = useMemo(() => {
    const map = new Map<string, ArchitectureCatalogNode>()
    for (const n of nodes) map.set(n.id, n)
    return map
  }, [nodes])

  const focusNode = focusId ? (nodeById.get(focusId) ?? null) : null

  const bulkSources = useMemo(
    () =>
      bulkSourceIds
        .map((id) => nodeById.get(id))
        .filter((n): n is ArchitectureCatalogNode => Boolean(n)),
    [bulkSourceIds, nodeById]
  )

  const { incoming, outgoing } = useMemo(
    () => (focusId ? partitionRelationsForFocus(items, focusId) : { incoming: [], outgoing: [] }),
    [items, focusId]
  )

  const selectedRelation = useMemo(
    () => items.find((r) => r.id === selectedRelationId) ?? null,
    [items, selectedRelationId]
  )

  const linkedToFocusIds = useMemo(() => {
    const set = new Set<string>()
    if (!focusId) return set
    for (const r of items) {
      if (r.fromNodeId === focusId) set.add(r.toNodeId)
      if (r.toNodeId === focusId) set.add(r.fromNodeId)
    }
    return set
  }, [items, focusId])

  useEffect(() => {
    if (!linkedToFocusIds.size) return
    setSelectedNodeIds((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (linkedToFocusIds.has(id)) changed = true
        else next.add(id)
      }
      return changed ? next : prev
    })
    setBulkSourceIds((prev) => {
      const next = prev.filter((id) => !linkedToFocusIds.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [linkedToFocusIds])
  const pushFocus = useCallback(
    (node: ArchitectureCatalogNode) => {
      setFocusId((prev) => {
        if (prev && prev !== node.id) {
          const prevNode = nodeById.get(prev)
          if (prevNode) setFocusHistory((h) => [...h.slice(-8), prevNode])
        }
        return node.id
      })
      setSelectedRelationId(null)
      setDropError(null)
    },
    [nodeById]
  )

  const backFocus = useCallback(() => {
    setFocusHistory((h) => {
      if (!h.length) return h
      const next = [...h]
      const prev = next.pop()!
      setFocusId(prev.id)
      return next
    })
  }, [])

  const focusOtherEnd = useCallback(
    (nodeId: string) => {
      const node = nodeById.get(nodeId)
      if (node) pushFocus(node)
    },
    [nodeById, pushFocus]
  )

  const showCreateUndo = useCallback(
    (created: StructureRelation[], summary: string) => {
      toast.success(summary, {
        duration: UNDO_MS,
        action: {
          label: 'Undo',
          onClick: () => {
            void (async () => {
              await removeRelations(created.map((r) => r.id))
              toast.message('Link undone')
            })()
          },
        },
      })
    },
    [removeRelations]
  )

  const showRemoveUndo = useCallback(
    (snapshots: StructureRelation[], summary: string) => {
      toast.success(summary, {
        duration: UNDO_MS,
        action: {
          label: 'Undo',
          onClick: () => {
            void (async () => {
              for (const snap of snapshots) await restore(snap)
              toast.message('Relation restored')
            })()
          },
        },
      })
    },
    [restore]
  )

  const resolveSources = useCallback((): ArchitectureCatalogNode[] | null => {
    if (bulkSources.length) return bulkSources
    if (focusNode) return [focusNode]
    return null
  }, [bulkSources, focusNode])

  const openBulkPreview = useCallback(
    (targets: ArchitectureCatalogNode[], relationType: string) => {
      const sources = resolveSources()
      if (!sources?.length) {
        setDropError('Select a focus node or add bulk sources first')
        return
      }
      const cleanTargets = targets.filter(
        (t) => !sources.some((s) => s.id === t.id && s.type === t.type)
      )
      if (!cleanTargets.length) {
        setDropError('Cannot link a node to itself')
        return
      }
      const plan = buildBulkPlan(items, sources, cleanTargets, relationType, direction)
      if (plan.kind === 'one-to-one' && plan.newCount === 1) {
        const body = plan.candidates.find((c) => c.status === 'new')?.body
        if (!body) {
          setDropError(plan.candidates[0]?.reason ?? 'Nothing to create')
          return
        }
        void (async () => {
          try {
            const created = await create(body)
            if (created) {
              showCreateUndo(
                [created],
                `Linked ${plan.sources[0].name} ${relationType} ${plan.targets[0].name}`
              )
            }
            setDropError(null)
          } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
              setDropError('This relation already exists')
            } else if (err instanceof ApiError && err.status === 422) {
              setDropError(err.message || 'Invalid relation')
            } else {
              setDropError(err instanceof Error ? err.message : 'Failed to create relation')
            }
          }
        })()
        return
      }
      setBulkPlan(plan)
      setBulkPreviewOpen(true)
      setDropError(null)
    },
    [resolveSources, items, direction, create, showCreateUndo]
  )

  const confirmBulk = useCallback(async () => {
    if (!bulkPlan) return
    const bodies = bulkPlan.candidates
      .filter((c) => c.status === 'new')
      .map((c) => c.body)
    const result = await linkRelations(bodies)
    setBulkPreviewOpen(false)
    setBulkPlan(null)
    setSelectedNodeIds(new Set())
    setBulkResult(result)
    setBulkResultOpen(true)
    if (result.createdRelations.length) {
      showCreateUndo(
        result.createdRelations,
        `${result.created} linked · ${result.skipped} skipped · ${result.failed} failed`
      )
    }
  }, [bulkPlan, linkRelations, showCreateUndo])

  const linkOne = useCallback(
    async (target: ArchitectureCatalogNode, relationType: string) => {
      openBulkPreview([target], relationType)
    },
    [openBulkPreview]
  )

  const linkSelected = useCallback(() => {
    if (!focusNode || selectedNodeIds.size === 0) return
    const targets = Array.from(selectedNodeIds)
      .map((id) => nodeById.get(id))
      .filter((n): n is ArchitectureCatalogNode => !!n && n.id !== focusNode.id)
    openBulkPreview(targets, activeRelationType)
  }, [focusNode, selectedNodeIds, nodeById, activeRelationType, openBulkPreview])

  const toggleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const selectIds = useCallback((ids: string[], mode: 'replace' | 'add') => {
    setSelectedNodeIds((prev) => {
      if (mode === 'replace') return new Set(ids)
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      return next
    })
  }, [])

  const toggleRelationSelect = useCallback((id: string) => {
    setSelectedRelationIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const removeSelectedRelations = useCallback(async () => {
    const ids = Array.from(selectedRelationIds)
    if (!ids.length) return
    const result = await removeRelations(ids)
    setSelectedRelationIds(new Set())
    if (selectedRelationId && ids.includes(selectedRelationId)) setSelectedRelationId(null)
    if (result.removedSnapshots.length) {
      showRemoveUndo(
        result.removedSnapshots,
        `${result.removed} relation${result.removed === 1 ? '' : 's'} removed`
      )
    }
  }, [selectedRelationIds, selectedRelationId, removeRelations, showRemoveUndo])

  const removeOne = useCallback(async () => {
    if (!selectedRelation) return
    const snap = await remove(selectedRelation.id)
    setSelectedRelationId(null)
    if (snap) showRemoveUndo([snap], 'Relation removed')
  }, [selectedRelation, remove, showRemoveUndo])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Typography weight="medium">Structure relations</Typography>
          <RelationGuideHint />
        </div>
        <Typography variant="small" tone="muted" className="mt-0.5">
          Single drag for one link · Bulk mode for multi-select and drag bundles.
          {items.length
            ? ` ${items.length} relation${items.length === 1 ? '' : 's'}.`
            : ''}
        </Typography>
        {error ? (
          <Typography tone="error" variant="small" className="mt-1">
            {error}
          </Typography>
        ) : null}
        {loading && items.length === 0 ? (
          <Typography variant="small" tone="muted" className="mt-1">
            Loading relations…
          </Typography>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(200px,240px)]">
        <ArchitectureNodePalette
          nodes={nodes}
          focusNodeId={focusId}
          selectedIds={selectedNodeIds}
          linkedToFocusIds={linkedToFocusIds}
          activeRelationType={activeRelationType}
          dragMode={dragMode}
          linking={isLinking}
          onDragModeChange={setDragMode}
          onToggleSelect={toggleNodeSelect}
          onSelectIds={selectIds}
          onSelectAllFiltered={(ids) => selectIds(ids, 'replace')}
          onClearSelection={() => setSelectedNodeIds(new Set())}
          onFocusNode={pushFocus}
          onQuickLink={(node) => void linkOne(node, activeRelationType)}
          onLinkSelected={() => linkSelected()}
        />

        <RelationDropWorkspace
          focusNode={focusNode}
          focusHistory={focusHistory}
          direction={direction}
          activeRelationType={activeRelationType}
          incoming={incoming}
          outgoing={outgoing}
          nodeById={nodeById}
          selectedRelationId={selectedRelationId}
          selectedRelationIds={selectedRelationIds}
          dropError={dropError}
          linking={isLinking}
          bulkSources={bulkSources}
          selectionCount={selectedNodeIds.size}
          onDirectionChange={setDirection}
          onActiveTypeChange={setActiveRelationType}
          onDropTargets={(targets, type) => openBulkPreview(targets, type)}
          onSelectRelation={(r) => setSelectedRelationId(r?.id ?? null)}
          onToggleRelationSelect={toggleRelationSelect}
          onFocusOtherEnd={focusOtherEnd}
          onBackFocus={backFocus}
          onRemoveSelected={() => void removeSelectedRelations()}
          onClearDropError={() => setDropError(null)}
          onRemoveBulkSource={(id) =>
            setBulkSourceIds((prev) => prev.filter((x) => x !== id))
          }
          onClearBulkSources={() => setBulkSourceIds([])}
          onAddBulkFromSelection={() => {
            setBulkSourceIds((prev) => {
              const next = new Set(prev)
              for (const id of selectedNodeIds) {
                if (id !== focusId) next.add(id)
              }
              return Array.from(next)
            })
            setDragMode('bulk')
          }}
        />

        <RelationInspector
          relation={selectedRelation}
          nodeById={nodeById}
          removing={isRemoving}
          onRemove={() => void removeOne()}
          onFocusFrom={() => focusOtherEnd(selectedRelation?.fromNodeId ?? '')}
          onFocusTo={() => focusOtherEnd(selectedRelation?.toNodeId ?? '')}
        />
      </div>

      <BulkRelationPreviewDialog
        open={bulkPreviewOpen}
        plan={bulkPlan}
        submitting={isLinking}
        onClose={() => {
          setBulkPreviewOpen(false)
          setBulkPlan(null)
        }}
        onConfirm={() => void confirmBulk()}
      />

      <BulkRelationResultDialog
        open={bulkResultOpen}
        result={bulkResult}
        onClose={() => {
          setBulkResultOpen(false)
          setBulkResult(null)
        }}
        onUndo={() => {
          if (!bulkResult?.createdRelations.length) return
          void (async () => {
            await removeRelations(bulkResult.createdRelations.map((r) => r.id))
            setBulkResultOpen(false)
            setBulkResult(null)
            toast.message('Created relations undone')
          })()
        }}
        onViewFailed={() => {
          /* list already visible in dialog */
        }}
      />
    </div>
  )
}
