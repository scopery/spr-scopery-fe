'use client'

import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Checkbox, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  ARCHITECTURE_NODE_TYPE_LABEL,
  type ArchitectureCatalogNode,
  type ArchitectureNodeType,
} from '../model/architecture-workbench'
import { labelArchitectureNode } from '../model/anchor-mapping'
import {
  encodeDragBundle,
  encodeDragNode,
  STRUCTURE_RELATION_DRAG_BUNDLE_MIME,
  STRUCTURE_RELATION_DRAG_MIME,
} from '../model/structure-relation.rules'

type TypeFilter = 'ALL' | ArchitectureNodeType
export type RelationDragMode = 'single' | 'bulk'

const FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'MODULE', label: 'Modules' },
  { id: 'SCREEN', label: 'Screens' },
  { id: 'API_ENDPOINT', label: 'APIs' },
  { id: 'COMPONENT', label: 'Components' },
  { id: 'DATA_ENTITY', label: 'Entities' },
]

interface ArchitectureNodePaletteProps {
  nodes: ArchitectureCatalogNode[]
  focusNodeId: string | null
  selectedIds: Set<string>
  /** Nodes that already have any relation with the focused node. */
  linkedToFocusIds: Set<string>
  activeRelationType: string
  dragMode: RelationDragMode
  onDragModeChange: (mode: RelationDragMode) => void
  onToggleSelect: (nodeId: string, opts?: { shiftKey?: boolean; metaKey?: boolean }) => void
  onSelectIds: (ids: string[], mode: 'replace' | 'add') => void
  onSelectAllFiltered: (ids: string[]) => void
  onClearSelection: () => void
  onFocusNode: (node: ArchitectureCatalogNode) => void
  onQuickLink: (node: ArchitectureCatalogNode) => void
  onLinkSelected: () => void
  linking?: boolean
}

export function ArchitectureNodePalette({
  nodes,
  focusNodeId,
  selectedIds,
  linkedToFocusIds,
  activeRelationType,
  dragMode,
  onDragModeChange,
  onToggleSelect,
  onSelectIds,
  onSelectAllFiltered,
  onClearSelection,
  onFocusNode,
  onQuickLink,
  onLinkSelected,
  linking = false,
}: ArchitectureNodePaletteProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  /** When false (default), hide nodes already related to the focus. */
  const [showAlreadyLinked, setShowAlreadyLinked] = useState(false)
  const lastClickedId = useRef<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return nodes.filter((node) => {
      if (focusNodeId && node.id === focusNodeId) return false
      if (typeFilter !== 'ALL' && node.type !== typeFilter) return false
      if (focusNodeId && !showAlreadyLinked && linkedToFocusIds.has(node.id)) {
        return false
      }
      if (!q) return true
      return [node.code, node.name, node.secondary]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [nodes, query, typeFilter, focusNodeId, showAlreadyLinked, linkedToFocusIds])

  const filteredIds = useMemo(() => filtered.map((n) => n.id), [filtered])

  const grouped = useMemo(() => {
    const map = new Map<ArchitectureNodeType, ArchitectureCatalogNode[]>()
    for (const n of filtered) {
      const list = map.get(n.type) ?? []
      list.push(n)
      map.set(n.type, list)
    }
    return map
  }, [filtered])

  const selectedCount = selectedIds.size
  const canBulkLink = Boolean(focusNodeId) && selectedCount > 0
  const isBulk = dragMode === 'bulk' || selectedCount > 1

  const handleRowClick = (
    e: React.MouseEvent,
    node: ArchitectureCatalogNode
  ) => {
    if (e.shiftKey && lastClickedId.current) {
      const a = filteredIds.indexOf(lastClickedId.current)
      const b = filteredIds.indexOf(node.id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        onSelectIds(filteredIds.slice(lo, hi + 1), 'add')
        onDragModeChange('bulk')
        return
      }
    }
    if (e.metaKey || e.ctrlKey) {
      onToggleSelect(node.id, { metaKey: true })
      onDragModeChange('bulk')
      lastClickedId.current = node.id
      return
    }
    onFocusNode(node)
    lastClickedId.current = node.id
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
      <div className="min-w-0 shrink-0 space-y-3 border-b border-neutral-100 p-3">
        <div className="flex items-center justify-between gap-2">
          <Typography weight="medium" size="sm">
            Architecture nodes
          </Typography>
          <div
            className="inline-flex border border-neutral-200"
            role="group"
            aria-label="Drag mode"
          >
            {(['single', 'bulk'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onDragModeChange(m)}
                className={cn(
                  'px-2 py-1 text-[10px] uppercase tracking-wide',
                  (m === 'bulk' ? isBulk : !isBulk && dragMode === 'single')
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 w-full">
          <Input
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, name, route, path…"
            aria-label="Search architecture nodes"
            prefix={<Search size={14} />}
          />
        </div>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Node type">
          {FILTERS.map((f) => {
            const active = typeFilter === f.id
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTypeFilter(f.id)}
                className={cn(
                  'px-2 py-1 text-xs transition-colors',
                  active
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            className={cn(
              'flex items-center gap-2 text-xs',
              focusNodeId
                ? 'cursor-pointer text-neutral-600'
                : 'cursor-not-allowed text-neutral-400'
            )}
          >
            <Checkbox
              size="sm"
              checked={showAlreadyLinked}
              disabled={!focusNodeId}
              onChange={(e) => setShowAlreadyLinked(e.target.checked)}
              aria-label="Show already linked"
            />
            Show already linked
            {focusNodeId && linkedToFocusIds.size > 0 ? (
              <span className="text-neutral-400">({linkedToFocusIds.size})</span>
            ) : null}
          </label>
          {filtered.length > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onSelectAllFiltered(filteredIds)
                onDragModeChange('bulk')
              }}
            >
              Select all {filtered.length}
            </Button>
          ) : null}
        </div>
      </div>

      {canBulkLink ? (
        <div className="shrink-0 border-b border-secondary/20 bg-secondary/5 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Typography variant="small">
              {selectedCount} selected · {activeRelationType}
            </Typography>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={onClearSelection}>
                Clear
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={linking}
                onClick={onLinkSelected}
              >
                Link {selectedCount}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <Typography variant="small" tone="muted" className="p-2">
            No nodes match.
          </Typography>
        ) : (
          Array.from(grouped.entries()).map(([type, list]) => (
            <div key={type} className="mb-3">
              <Typography
                variant="small"
                tone="muted"
                className="px-2 py-1 text-[10px] uppercase tracking-wide"
              >
                {ARCHITECTURE_NODE_TYPE_LABEL[type]}
              </Typography>
              <ul className="space-y-0.5">
                {list.map((node) => {
                  const isFocus = node.id === focusNodeId
                  const linked = linkedToFocusIds.has(node.id)
                  const selected = selectedIds.has(node.id)
                  const dragBundle =
                    selected && selectedCount > 1
                      ? nodes.filter((n) => selectedIds.has(n.id) && n.id !== focusNodeId)
                      : null

                  return (
                    <li key={`${node.type}:${node.id}`}>
                      <div
                        draggable={!isFocus}
                        onDragStart={(e) => {
                          if (isFocus) {
                            e.preventDefault()
                            return
                          }
                          if (dragBundle && dragBundle.length > 1) {
                            e.dataTransfer.setData(
                              STRUCTURE_RELATION_DRAG_BUNDLE_MIME,
                              encodeDragBundle(dragBundle)
                            )
                            e.dataTransfer.setData(
                              'text/plain',
                              `${dragBundle.length} nodes`
                            )
                          } else {
                            e.dataTransfer.setData(
                              STRUCTURE_RELATION_DRAG_MIME,
                              encodeDragNode(node)
                            )
                          }
                          e.dataTransfer.effectAllowed = 'link'
                        }}
                        className={cn(
                          'group flex items-start gap-2 border border-transparent px-2 py-1.5',
                          isFocus
                            ? 'bg-secondary text-white'
                            : selected
                              ? 'border-secondary/40 bg-secondary/5'
                              : 'hover:bg-neutral-50',
                          !isFocus && 'cursor-grab active:cursor-grabbing'
                        )}
                      >
                        <Checkbox
                          size="sm"
                          checked={selected}
                          disabled={isFocus}
                          onChange={(e) => {
                            e.stopPropagation()
                            onToggleSelect(node.id, { metaKey: true })
                            onDragModeChange('bulk')
                          }}
                          aria-label={`Select ${labelArchitectureNode(node)}`}
                          className="mt-0.5 shrink-0"
                        />
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={(e) => handleRowClick(e, node)}
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            if (!isFocus && !linked && dragMode === 'single') {
                              onQuickLink(node)
                            }
                          }}
                          title={
                            linked
                              ? `Linked · ${activeRelationType}`
                              : 'Click to focus · Shift/Cmd+click to multi-select · drag to link'
                          }
                        >
                          <div
                            className={cn(
                              'truncate text-sm',
                              isFocus ? 'text-white' : 'text-neutral-900'
                            )}
                          >
                            {node.name}
                          </div>
                          <div
                            className={cn(
                              'truncate text-xs',
                              isFocus ? 'text-white/80' : 'text-neutral-500'
                            )}
                          >
                            {ARCHITECTURE_NODE_TYPE_LABEL[node.type]} · {node.code}
                            {node.secondary ? ` · ${node.secondary}` : ''}
                          </div>
                          {linked ? (
                            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
                              Already linked
                            </div>
                          ) : null}
                          {selected && selectedCount > 1 && !isFocus ? (
                            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-secondary">
                              In drag bundle
                            </div>
                          ) : null}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
