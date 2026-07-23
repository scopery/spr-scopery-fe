'use client'

import { useMemo } from 'react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type {
  OverallStructureResponse,
  StructureFocus,
} from '../model/overall-structure'
import { StructureFocusType } from '../model/overall-structure'
import {
  encodeStructureDrag,
  isSameStructureNode,
  STRUCTURE_ASSIGN_DRAG_MIME,
  type StructureDragKind,
} from '../model/structure-assign.rules'
import { setActiveStructureDrag } from '../model/structure-drag-session'

export interface StructureGapItem {
  id: string
  kind: StructureDragKind
  label: string
  reason: string
  focus: StructureFocus
  projectId?: string | null
}

export function deriveStructureGaps(
  tree: OverallStructureResponse | null
): { category: string; items: StructureGapItem[] }[] {
  if (!tree) return []

  const withoutModule: StructureGapItem[] = (tree.unassignedFunctions ?? []).map(
    (fn) => ({
      id: fn.id,
      kind: StructureFocusType.Function,
      label: `${fn.code} · ${fn.title}`,
      reason: 'No owning Module',
      focus: { type: StructureFocusType.Function, id: fn.id },
      projectId: fn.projectId,
    })
  )

  const withoutScreen: StructureGapItem[] = []
  const withoutApi: StructureGapItem[] = []
  for (const mod of tree.modules) {
    for (const fn of mod.functions) {
      if (!fn.screens?.length) {
        withoutScreen.push({
          id: fn.id,
          kind: StructureFocusType.Function,
          label: `${fn.code} · ${fn.title}`,
          reason: 'No Screen linked',
          focus: { type: StructureFocusType.Function, id: fn.id },
          projectId: fn.projectId,
        })
      }
      if (!fn.apis?.length) {
        withoutApi.push({
          id: fn.id,
          kind: StructureFocusType.Function,
          label: `${fn.code} · ${fn.title}`,
          reason: 'No API linked',
          focus: { type: StructureFocusType.Function, id: fn.id },
          projectId: fn.projectId,
        })
      }
    }
  }
  for (const fn of tree.unassignedFunctions ?? []) {
    if (!fn.screens?.length) {
      withoutScreen.push({
        id: `scr-${fn.id}`,
        kind: StructureFocusType.Function,
        label: `${fn.code} · ${fn.title}`,
        reason: 'No Screen linked',
        focus: { type: StructureFocusType.Function, id: fn.id },
        projectId: fn.projectId,
      })
    }
    if (!fn.apis?.length) {
      withoutApi.push({
        id: `api-${fn.id}`,
        kind: StructureFocusType.Function,
        label: `${fn.code} · ${fn.title}`,
        reason: 'No API linked',
        focus: { type: StructureFocusType.Function, id: fn.id },
        projectId: fn.projectId,
      })
    }
  }

  const entitiesWithoutModule: StructureGapItem[] = (
    tree.unassignedEntities ?? []
  ).map((ent) => ({
    id: ent.id,
    kind: StructureFocusType.Entity,
    label: `${ent.code} · ${ent.name}`,
    reason: 'No owning Module',
    focus: { type: StructureFocusType.Entity, id: ent.id },
  }))

  const nfrsWithoutScope: StructureGapItem[] = (tree.applicationNfrs ?? []).map(
    (nfr) => ({
      id: nfr.id,
      kind: StructureFocusType.Nfr,
      label: `${nfr.code} · ${nfr.title}`,
      reason: 'Application-wide / review scope',
      focus: { type: StructureFocusType.Nfr, id: nfr.id },
      projectId: nfr.projectId,
    })
  )

  return [
    { category: 'Functions without Module', items: withoutModule },
    { category: 'Functions without Screen', items: withoutScreen },
    { category: 'Functions without API', items: withoutApi },
    { category: 'Entities without Module', items: entitiesWithoutModule },
    { category: 'NFRs to review', items: nfrsWithoutScope },
  ].filter((g) => g.items.length > 0)
}

interface StructureGapsPanelProps {
  tree: OverallStructureResponse | null
  focus: StructureFocus | null
  onFocus: (focus: StructureFocus) => void
  projectId: string | null
}

export function StructureGapsPanel({
  tree,
  focus,
  onFocus,
  projectId,
}: StructureGapsPanelProps) {
  const groups = useMemo(() => deriveStructureGaps(tree), [tree])
  const total = groups.reduce((n, g) => n + g.items.length, 0)

  if (!tree) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Typography variant="small" tone="muted">
          Load structure to see gaps.
        </Typography>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <Typography weight="medium">No gaps detected</Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Functions have modules/screens/APIs where measurable from this tree.
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
        <Typography weight="medium">Unmapped items · {total}</Typography>
        <Typography variant="small" tone="muted" className="mt-0.5">
          Click to focus and open the assignment dock, or drag onto a compatible drop zone.
        </Typography>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.category} className="mb-4">
            <Typography
              variant="small"
              tone="muted"
              className="mb-1 px-1 text-[10px] uppercase tracking-wide"
            >
              {g.category} · {g.items.length}
            </Typography>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active =
                  focus?.type === item.focus.type && focus.id === item.focus.id
                const isSelf = isSameStructureNode(item.focus.id, focus)
                return (
                  <li key={`${g.category}:${item.id}`}>
                    <div
                      draggable={!isSelf}
                      onDragStart={(e) => {
                        if (isSelf) {
                          e.preventDefault()
                          return
                        }
                        const payload = {
                          kind: item.kind,
                          id: item.focus.id,
                          label: item.label,
                          projectId: item.projectId ?? projectId,
                        }
                        setActiveStructureDrag(payload)
                        e.dataTransfer.setData(
                          STRUCTURE_ASSIGN_DRAG_MIME,
                          encodeStructureDrag(payload)
                        )
                        e.dataTransfer.effectAllowed = 'link'
                      }}
                      onDragEnd={() => setActiveStructureDrag(null)}
                      onClick={() => onFocus(item.focus)}
                      className={cn(
                        'cursor-pointer border border-transparent px-2 py-1.5 hover:bg-secondary/5',
                        active && 'bg-secondary text-white hover:bg-secondary',
                        isSelf && 'cursor-default opacity-60'
                      )}
                    >
                      <div className="truncate text-sm">{item.label}</div>
                      <div
                        className={cn(
                          'truncate text-xs',
                          active ? 'text-white/80' : 'text-neutral-500'
                        )}
                      >
                        {isSelf ? 'Current selection' : item.reason}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
