'use client'

import { useMemo, useState } from 'react'
import { Button, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  ARCHITECTURE_NODE_TYPE_LABEL,
  type ArchitectureCatalogNode,
} from '../model/architecture-workbench'
import { labelArchitectureNode } from '../model/anchor-mapping'
import {
  StructureRelationType,
  type StructureRelation,
} from '../model/structure-relation'
import {
  decodeDragBundle,
  decodeDragNode,
  groupByRelationType,
  STRUCTURE_RELATION_DRAG_BUNDLE_MIME,
  STRUCTURE_RELATION_DRAG_MIME,
  type RelationDirection,
} from '../model/structure-relation.rules'
import { BulkSourceTray } from './BulkSourceTray'

const LANES: { type: string; hint: string }[] = [
  { type: StructureRelationType.Uses, hint: 'Drop nodes the focus uses' },
  { type: StructureRelationType.Implements, hint: 'Drop nodes the focus implements' },
  { type: StructureRelationType.Related, hint: 'Drop any related node' },
]

interface RelationDropWorkspaceProps {
  focusNode: ArchitectureCatalogNode | null
  focusHistory: ArchitectureCatalogNode[]
  direction: RelationDirection
  activeRelationType: string
  incoming: StructureRelation[]
  outgoing: StructureRelation[]
  nodeById: Map<string, ArchitectureCatalogNode>
  selectedRelationId: string | null
  selectedRelationIds: Set<string>
  dropError: string | null
  linking?: boolean
  bulkSources: ArchitectureCatalogNode[]
  selectionCount: number
  onDirectionChange: (d: RelationDirection) => void
  onActiveTypeChange: (t: string) => void
  /** Dropped node(s) as the other side of the relation(s). */
  onDropTargets: (targets: ArchitectureCatalogNode[], relationType: string) => void
  onSelectRelation: (r: StructureRelation | null) => void
  onToggleRelationSelect: (id: string) => void
  onFocusOtherEnd: (nodeId: string) => void
  onBackFocus: () => void
  onRemoveSelected: () => void
  onClearDropError: () => void
  onRemoveBulkSource: (id: string) => void
  onClearBulkSources: () => void
  onAddBulkFromSelection: () => void
}

function endLabel(
  nodeType: string,
  nodeId: string,
  nodeById: Map<string, ArchitectureCatalogNode>
): string {
  const node = nodeById.get(nodeId)
  if (node) {
    return `${ARCHITECTURE_NODE_TYPE_LABEL[node.type]} · ${labelArchitectureNode(node)}`
  }
  return `${nodeType} · Unavailable node`
}

export function RelationDropWorkspace({
  focusNode,
  focusHistory,
  direction,
  activeRelationType,
  incoming,
  outgoing,
  nodeById,
  selectedRelationId,
  selectedRelationIds,
  dropError,
  linking = false,
  bulkSources,
  selectionCount,
  onDirectionChange,
  onActiveTypeChange,
  onDropTargets,
  onSelectRelation,
  onToggleRelationSelect,
  onFocusOtherEnd,
  onBackFocus,
  onRemoveSelected,
  onClearDropError,
  onRemoveBulkSource,
  onClearBulkSources,
  onAddBulkFromSelection,
}: RelationDropWorkspaceProps) {
  const [dragOverLane, setDragOverLane] = useState<string | null>(null)

  const outGroups = useMemo(() => groupByRelationType(outgoing), [outgoing])
  const inGroups = useMemo(() => groupByRelationType(incoming), [incoming])

  const handleDragOver = (e: React.DragEvent, lane: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'link'
    setDragOverLane(lane)
    onClearDropError()
  }

  const handleDrop = (e: React.DragEvent, relationType: string) => {
    e.preventDefault()
    setDragOverLane(null)
    const bundleRaw = e.dataTransfer.getData(STRUCTURE_RELATION_DRAG_BUNDLE_MIME)
    const singleRaw =
      e.dataTransfer.getData(STRUCTURE_RELATION_DRAG_MIME) ||
      e.dataTransfer.getData('text/plain')

    const payloads =
      decodeDragBundle(bundleRaw) ??
      (() => {
        const one = decodeDragNode(singleRaw)
        return one ? [one] : null
      })()

    if (!payloads?.length) return
    if (!focusNode && bulkSources.length === 0) return
    const targets = payloads
      .map((p) => nodeById.get(p.id))
      .filter((n): n is ArchitectureCatalogNode => Boolean(n))
    if (!targets.length) return
    onDropTargets(targets, relationType)
  }

  if (!focusNode && bulkSources.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <Typography weight="medium">Select a focus node</Typography>
        <Typography variant="small" tone="muted" className="max-w-sm">
          Pick a node from the left palette (or from Browse), or multi-select nodes and add
          them as bulk sources.
        </Typography>
      </div>
    )
  }

  const headerName = focusNode?.name ?? `${bulkSources.length} bulk sources`
  const headerMeta = focusNode
    ? `${ARCHITECTURE_NODE_TYPE_LABEL[focusNode.type]} · ${focusNode.code}${
        focusNode.secondary ? ` · ${focusNode.secondary}` : ''
      }`
    : 'Drop targets into a relation lane'

  const renderGroup = (
    title: string,
    groups: Record<string, StructureRelation[]>,
    side: 'from' | 'to'
  ) => {
    const total = Object.values(groups).reduce((n, list) => n + list.length, 0)
    if (total === 0) {
      return (
        <Typography variant="small" tone="muted" className="py-2">
          No {title.toLowerCase()} yet.
        </Typography>
      )
    }
    return (
      <div className="space-y-3">
        {LANES.map(({ type }) => {
          const list = groups[type] ?? []
          if (!list.length) return null
          return (
            <div key={`${title}-${type}`}>
              <Typography
                variant="small"
                tone="muted"
                className="mb-1 text-[10px] uppercase tracking-wide"
              >
                {type}
              </Typography>
              <ul className="space-y-1">
                {list.map((r) => {
                  const otherId = side === 'from' ? r.toNodeId : r.fromNodeId
                  const otherType = side === 'from' ? r.toNodeType : r.fromNodeType
                  const label = endLabel(otherType, otherId, nodeById)
                  const checked = selectedRelationIds.has(r.id)
                  const active = selectedRelationId === r.id
                  return (
                    <li
                      key={r.id}
                      className={cn(
                        'flex items-center gap-2 border border-transparent px-2 py-1.5',
                        active
                          ? 'border-secondary/40 bg-secondary/5'
                          : 'hover:bg-neutral-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleRelationSelect(r.id)}
                        className="h-3.5 w-3.5 shrink-0 accent-secondary"
                        aria-label={`Select relation ${label}`}
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-sm text-neutral-900 hover:underline"
                        onClick={() => onSelectRelation(r)}
                        onDoubleClick={() => onFocusOtherEnd(otherId)}
                        title="Click to inspect · double-click to focus"
                      >
                        {label}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onFocusOtherEnd(otherId)}
                      >
                        Focus
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 space-y-3 border-b border-neutral-100 p-4">
        {focusHistory.length > 0 ? (
          <button
            type="button"
            className="text-xs text-neutral-500 hover:text-neutral-900 hover:underline"
            onClick={onBackFocus}
          >
            ← {focusHistory[focusHistory.length - 1]?.name ?? 'Back'}
          </button>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Typography weight="medium">{headerName}</Typography>
            <Typography variant="small" tone="muted">
              {headerMeta}
            </Typography>
          </div>
          {focusNode ? (
            <span className="bg-secondary px-2 py-1 text-xs text-white">Focused</span>
          ) : (
            <span className="bg-neutral-700 px-2 py-1 text-xs text-white">Bulk</span>
          )}
        </div>

        <div
          className="inline-flex border border-primary/30"
          role="group"
          aria-label="Relation type"
        >
          {LANES.map(({ type }) => (
            <button
              key={type}
              type="button"
              onClick={() => onActiveTypeChange(type)}
              className={cn(
                'px-3 py-1.5 text-xs uppercase tracking-wide',
                activeRelationType === type
                  ? 'bg-primary text-white'
                  : 'text-neutral-700 hover:bg-primary/10'
              )}
            >
              {type}
            </button>
          ))}
        </div>

        <fieldset className="space-y-1">
          <legend className="text-xs text-neutral-500">Direction</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-900">
            <input
              type="radio"
              name="rel-direction"
              checked={direction === 'focus-as-from'}
              onChange={() => onDirectionChange('focus-as-from')}
              className="accent-secondary"
            />
            Focus / bulk sources are From (outgoing)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-900">
            <input
              type="radio"
              name="rel-direction"
              checked={direction === 'focus-as-to'}
              onChange={() => onDirectionChange('focus-as-to')}
              className="accent-secondary"
            />
            Focus / bulk sources are To (incoming)
          </label>
        </fieldset>

        <BulkSourceTray
          sources={bulkSources}
          selectionCount={selectionCount}
          onRemove={onRemoveBulkSource}
          onClear={onClearBulkSources}
          onAddFromSelection={onAddBulkFromSelection}
        />
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <Typography weight="medium" size="sm" className="mb-2">
            Drop lanes
          </Typography>
          <div className="grid gap-2 sm:grid-cols-3">
            {LANES.map(({ type, hint }) => {
              const over = dragOverLane === type
              return (
                <div
                  key={type}
                  onDragOver={(e) => handleDragOver(e, type)}
                  onDragLeave={() => setDragOverLane(null)}
                  onDrop={(e) => handleDrop(e, type)}
                  className={cn(
                    'min-h-[88px] border border-dashed p-3 transition-colors',
                    over
                      ? 'border-secondary bg-secondary/10'
                      : 'border-secondary/30 bg-neutral-50'
                  )}
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-neutral-900">
                    {type}
                  </div>
                  <Typography variant="small" tone="muted" className="mt-1">
                    {over
                      ? bulkSources.length > 1 || selectionCount > 1
                        ? `Drop to bulk-link · ${type}`
                        : `Drop to link with ${headerName} · ${type}`
                      : bulkSources.length
                        ? `Drop one or more target nodes · ${bulkSources.length} sources`
                        : hint}
                  </Typography>
                </div>
              )
            })}
          </div>
          {dropError ? (
            <Typography tone="error" variant="small" className="mt-2">
              {dropError}
            </Typography>
          ) : null}
          {linking ? (
            <Typography variant="small" tone="muted" className="mt-2">
              Linking…
            </Typography>
          ) : null}
        </div>

        {selectedRelationIds.size > 0 ? (
          <div className="flex items-center justify-between gap-2 bg-secondary/5 px-3 py-2">
            <Typography variant="small">{selectedRelationIds.size} selected</Typography>
            <Button size="sm" variant="ghost" onClick={onRemoveSelected}>
              Remove relations
            </Button>
          </div>
        ) : null}

        <div>
          <Typography weight="medium" size="sm" className="mb-2">
            Outgoing
          </Typography>
          {renderGroup('Outgoing', outGroups, 'from')}
        </div>

        <div>
          <Typography weight="medium" size="sm" className="mb-2">
            Incoming
          </Typography>
          {renderGroup('Incoming', inGroups, 'to')}
        </div>
      </div>
    </div>
  )
}
