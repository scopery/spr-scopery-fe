'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Checkbox, Input, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type {
  StructureCandidateItem,
  StructureCandidatesResponse,
  StructureFocus,
} from '../model/overall-structure'
import { StructureFocusType } from '../model/overall-structure'
import {
  actionLabel,
  availablePaletteGroupIdsForFocus,
  encodeStructureDrag,
  isAssignableCandidateKind,
  isSameStructureNode,
  resolveStructureAssignAction,
  STRUCTURE_ASSIGN_DRAG_MIME,
  type StructureAssignDragPayload,
  type StructureDragKind,
} from '../model/structure-assign.rules'
import { setActiveStructureDrag } from '../model/structure-drag-session'

interface StructureCandidatePaletteProps {
  focus: StructureFocus | null
  candidates: StructureCandidatesResponse | null
  loading?: boolean
  projectId: string | null
  onAssign: (payload: StructureAssignDragPayload) => void
  onAssignMany: (payloads: StructureAssignDragPayload[]) => void
  onViewLinked?: (focus: StructureFocus) => void
}

type CandidateGroup = {
  id: string
  group: string
  items: StructureCandidateItem[]
  kind: StructureDragKind
}

function flattenCandidates(
  candidates: StructureCandidatesResponse | null,
  focus: StructureFocus | null
): CandidateGroup[] {
  if (!candidates || !focus) return []
  const allowed = new Set(availablePaletteGroupIdsForFocus(focus.type))
  if (allowed.size === 0) return []

  const groups: CandidateGroup[] = []
  const push = (
    id: string,
    group: string,
    items: StructureCandidateItem[] | undefined,
    kind: StructureDragKind
  ) => {
    if (!allowed.has(id) || !items?.length) return
    const filteredItems = items.filter((item) => {
      const itemKind = (item.kind as StructureDragKind) || kind
      return isAssignableCandidateKind(itemKind, focus)
    })
    if (!filteredItems.length) return
    groups.push({ id, group, items: filteredItems, kind })
  }

  push('screens', 'Screens', candidates.screens, StructureFocusType.Screen)
  push('apis', 'APIs', candidates.apis, StructureFocusType.ApiEndpoint)
  push(
    'communications',
    'Communications',
    candidates.communications,
    StructureFocusType.Communication
  )
  push('components', 'Components', candidates.components, StructureFocusType.Component)
  push('functions', 'Functions', candidates.functions, StructureFocusType.Function)
  push('entities', 'Entities', candidates.entities, StructureFocusType.Entity)
  push('modules', 'Modules', candidates.modules, StructureFocusType.Module)
  push('nfrs', 'NFRs', candidates.nfrs, StructureFocusType.Nfr)
  push('nfrTargets', 'NFR targets', candidates.nfrTargets, StructureFocusType.Module)

  return groups
}

export function StructureCandidatePalette({
  focus,
  candidates,
  loading = false,
  projectId,
  onAssign,
  onAssignMany,
  onViewLinked,
}: StructureCandidatePaletteProps) {
  const [query, setQuery] = useState('')
  /** Default true: already-linked (+ current focus) are removed from the list. */
  const [hideLinked, setHideLinked] = useState(true)
  const [tab, setTab] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [preview, setPreview] = useState<StructureCandidateItem | null>(null)

  const groups = useMemo(
    () => flattenCandidates(candidates, focus),
    [candidates, focus]
  )

  useEffect(() => {
    setTab('all')
    setSelected(new Set())
    setQuery('')
    setPreview(null)
  }, [focus?.type, focus?.id])

  const allowedGroupIds = useMemo(
    () => (focus ? availablePaletteGroupIdsForFocus(focus.type) : []),
    [focus]
  )

  const focusAvailabilityHint = useMemo(() => {
    if (!focus) return ''
    switch (focus.type) {
      case StructureFocusType.Function:
        return 'Showing Screens, APIs, and NFRs for this Function'
      case StructureFocusType.Screen:
        return 'Showing Components for this Screen'
      case StructureFocusType.Module:
        return 'Showing Functions, Entities, and NFRs for this Module'
      case StructureFocusType.Nfr:
        return 'Showing Module, Function, and Screen scope targets'
      default:
        return 'This node type does not accept assignments'
    }
  }, [focus])

  const linkedOrSelfCount = useMemo(() => {
    let n = 0
    for (const g of groups) {
      for (const item of g.items) {
        const isSelf = Boolean(focus && item.id === focus.id)
        if (item.alreadyLinked || item.hasExistingLink || isSelf) n += 1
      }
    }
    return n
  }, [groups, focus])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          const isSelf = Boolean(focus && item.id === focus.id)
          const isTaken =
            Boolean(item.alreadyLinked) || Boolean(item.hasExistingLink) || isSelf
          if (hideLinked && isTaken) return false
          if (!q) return true
          return [item.code, item.name, item.secondary, item.description]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        }),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, query, hideLinked, focus])

  const visibleGroups =
    tab === 'all' ? filtered : filtered.filter((g) => g.id === tab)

  const selectedPayloads = useMemo(() => {
    const out: StructureAssignDragPayload[] = []
    for (const g of filtered) {
      for (const item of g.items) {
        const kind = (item.kind as StructureDragKind) || g.kind
        const key = `${kind}:${item.id}`
        if (!selected.has(key) || item.alreadyLinked) continue
        if (focus && item.id === focus.id) continue
        out.push({ kind, id: item.id, label: item.name, projectId })
      }
    }
    return out
  }, [filtered, selected, projectId, focus])

  const selectableFilteredKeys = useMemo(() => {
    const keys: string[] = []
    for (const g of visibleGroups) {
      for (const item of g.items) {
        const isSelf = Boolean(focus && item.id === focus.id)
        const isTaken =
          Boolean(item.alreadyLinked) || Boolean(item.hasExistingLink) || isSelf
        if (isTaken) continue
        const kind = (item.kind as StructureDragKind) || g.kind
        keys.push(`${kind}:${item.id}`)
      }
    }
    return keys
  }, [visibleGroups, focus])

  const allFilteredSelected =
    selectableFilteredKeys.length > 0 &&
    selectableFilteredKeys.every((key) => selected.has(key))

  const toggleSelectAllFiltered = () => {
    if (selectableFilteredKeys.length === 0) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const key of selectableFilteredKeys) next.delete(key)
      } else {
        for (const key of selectableFilteredKeys) next.add(key)
      }
      return next
    })
  }

  const toggleSelect = (key: string, alreadyLinked?: boolean) => {
    if (alreadyLinked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && selectedPayloads.length > 0) {
        e.preventDefault()
        setBulkOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPayloads.length])

  if (!focus) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <Typography weight="medium" size="sm">
          Available
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Select a node to see candidates.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
      <div className="shrink-0 space-y-2 border-b border-neutral-100 p-3">
        <Typography weight="medium" size="sm">
          Available to assign
        </Typography>
        <Typography variant="small" tone="muted">
          {focusAvailabilityHint}
        </Typography>
        <Input
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          aria-label="Search candidates"
          prefix={<Search size={14} />}
        />
        {filtered.length > 1 || (tab !== 'all' && allowedGroupIds.length > 1) ? (
          <div className="flex flex-wrap gap-1">
            <TabChip active={tab === 'all'} onClick={() => setTab('all')} label="All" />
            {filtered.map((g) => (
              <TabChip
                key={g.id}
                active={tab === g.id}
                onClick={() => setTab(g.id)}
                label={g.group}
              />
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-neutral-200 bg-neutral-50 px-2.5 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
            <Checkbox
              size="sm"
              checked={hideLinked}
              onChange={(e) => setHideLinked(e.target.checked)}
              aria-label="Hide already assigned items"
            />
            Hide already assigned
            {linkedOrSelfCount > 0 ? (
              <span className="text-neutral-400">({linkedOrSelfCount})</span>
            ) : null}
          </label>
          {!hideLinked ? (
            <button
              type="button"
              className="text-xs text-neutral-500 underline hover:text-neutral-800"
              onClick={() => setHideLinked(true)}
            >
              Hide them
            </button>
          ) : linkedOrSelfCount > 0 ? (
            <button
              type="button"
              className="text-xs text-neutral-500 underline hover:text-neutral-800"
              onClick={() => setHideLinked(false)}
            >
              Show assigned
            </button>
          ) : null}
        </div>
        {!hideLinked && linkedOrSelfCount > 0 ? (
          <Typography variant="small" tone="muted">
            Assigned items stay visible for review (Assigned here / elsewhere) but cannot be
            re-dragged onto the same focus.
          </Typography>
        ) : null}
        {!projectId ? (
          <Typography variant="small" tone="muted">
            Pick a project to link Screens / APIs / NFRs.
          </Typography>
        ) : null}
        {selectableFilteredKeys.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Typography variant="small" tone="muted">
              {selectableFilteredKeys.length} available
              {selectedPayloads.length > 0 ? ` · ${selectedPayloads.length} selected` : ''}
            </Typography>
            <Button
              size="sm"
              variant="ghost"
              className="h-auto px-0 font-normal"
              onClick={toggleSelectAllFiltered}
            >
              {allFilteredSelected ? 'Clear all' : 'Select all'}
            </Button>
          </div>
        ) : null}
        {selectedPayloads.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBulkOpen(true)}>
              Assign selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        ) : null}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto p-2"
        onMouseLeave={() => setPreview(null)}
      >
        {loading && visibleGroups.length === 0 ? (
          <Typography variant="small" tone="muted" className="p-2">
            Loading candidates…
          </Typography>
        ) : visibleGroups.length === 0 ? (
          <Typography variant="small" tone="muted" className="p-2">
            {allowedGroupIds.length === 0
              ? 'Select a Module, Function, Screen, or NFR to assign.'
              : hideLinked
                ? 'No unassigned candidates. Click “Show assigned” to review items that already have a link.'
                : 'No candidates for this focus.'}
          </Typography>
        ) : (
          visibleGroups.map((g) => (
            <div key={g.group} className="mb-3">
              <Typography
                variant="small"
                tone="muted"
                className="px-2 py-1 text-[10px] uppercase tracking-wide"
              >
                {g.group}
              </Typography>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const kind = (item.kind as StructureDragKind) || g.kind
                  const key = `${kind}:${item.id}`
                  const isSelf = isSameStructureNode(item.id, focus)
                  const action = resolveStructureAssignAction(kind, focus, item.id)
                  const disabled =
                    Boolean(item.alreadyLinked) || isSelf || !action
                  return (
                    <li key={key}>
                      <div
                        draggable={!disabled}
                        onMouseEnter={() => setPreview(item)}
                        onFocus={() => setPreview(item)}
                        onDragStart={(e) => {
                          if (disabled) {
                            e.preventDefault()
                            return
                          }
                          const payloads =
                            selectedPayloads.length > 1 && selected.has(key)
                              ? selectedPayloads.filter((p) => p.id !== focus.id)
                              : [{ kind, id: item.id, label: item.name, projectId }]
                          if (!payloads.length) {
                            e.preventDefault()
                            return
                          }
                          setActiveStructureDrag(payloads[0])
                          e.dataTransfer.setData(
                            STRUCTURE_ASSIGN_DRAG_MIME,
                            encodeStructureDrag(payloads[0])
                          )
                          e.dataTransfer.setData(
                            'application/x-scopery-structure-assign-bulk',
                            JSON.stringify(payloads)
                          )
                          e.dataTransfer.effectAllowed = 'link'
                        }}
                        onDragEnd={() => setActiveStructureDrag(null)}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey) {
                            toggleSelect(key, item.alreadyLinked || isSelf)
                          }
                        }}
                        className={cn(
                          'flex items-start gap-2 border border-transparent px-2.5 py-2',
                          disabled
                            ? 'opacity-60'
                            : 'cursor-grab hover:bg-secondary/5 active:cursor-grabbing',
                          selected.has(key) && 'bg-secondary/10',
                          preview?.id === item.id && 'bg-neutral-50'
                        )}
                      >
                        {!disabled ? (
                          <Checkbox
                            size="sm"
                            checked={selected.has(key)}
                            onChange={() => toggleSelect(key)}
                            aria-label={`Select ${item.name}`}
                          />
                        ) : (
                          <span className="w-4" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-neutral-900">
                            {item.name}
                          </div>
                          <div className="truncate text-xs text-neutral-500">
                            {[item.code, item.secondary].filter(Boolean).join(' · ')}
                            {isSelf
                              ? ' · Current selection'
                              : item.alreadyLinked
                                ? ' · Already linked'
                                : ''}
                          </div>
                        </div>
                        {isSelf ? null : item.alreadyLinked && onViewLinked ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onViewLinked({
                                type: kind as StructureFocus['type'],
                                id: item.id,
                              })
                            }
                          >
                            View
                          </Button>
                        ) : action ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onAssign({
                                kind,
                                id: item.id,
                                label: item.name,
                                projectId,
                              })
                            }
                          >
                            {actionLabel(action)}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-neutral-100 bg-neutral-50 px-3 py-2.5">
        {preview ? (
          <>
            <div className="truncate text-xs font-medium text-neutral-900">
              {preview.name}
              {preview.code ? (
                <span className="ml-1 font-normal text-neutral-500">({preview.code})</span>
              ) : null}
            </div>
            <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-neutral-600">
              {preview.description?.trim() || 'No description for this item.'}
            </p>
          </>
        ) : (
          <Typography variant="small" tone="muted">
            Hover an item to read its description — row height stays fixed so select stays easy.
          </Typography>
        )}
      </div>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk assign preview"
        size="md"
        actions={[
          { label: 'Cancel', variant: 'ghost', onClick: () => setBulkOpen(false) },
          {
            label: `Assign ${selectedPayloads.length}`,
            variant: 'secondary',
            onClick: () => {
              setBulkOpen(false)
              void onAssignMany(selectedPayloads)
              setSelected(new Set())
            },
          },
        ]}
      >
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {selectedPayloads.map((p) => (
            <li key={`${p.kind}:${p.id}`} className="text-neutral-900">
              {p.label}{' '}
              <span className="text-xs text-neutral-500">({p.kind})</span>
            </li>
          ))}
        </ul>
        <Typography variant="small" tone="muted" className="mt-2">
          {selectedPayloads.length} new link
          {selectedPayloads.length === 1 ? '' : 's'} to the focused node.
        </Typography>
      </Modal>
    </div>
  )
}

function TabChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 text-xs',
        active ? 'bg-secondary text-white' : 'bg-neutral-100 text-neutral-700'
      )}
    >
      {label}
    </button>
  )
}
