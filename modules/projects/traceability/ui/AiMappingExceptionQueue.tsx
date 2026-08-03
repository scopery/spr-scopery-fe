'use client'

import { useMemo, type MouseEvent } from 'react'
import { Button, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type {
  EntityLabel,
  MappingRelationType as MappingRelationTypeValue,
  MappingSuggestion,
} from '../model/mapping-suggestions'
import { AiMappingCandidatePicker } from './AiMappingCandidatePicker'

interface AiMappingExceptionQueueProps {
  projectId: string
  relationType: MappingRelationTypeValue
  items: MappingSuggestion[]
  allSuggestions: MappingSuggestion[]
  focusedId: string | null
  changingId: string | null
  onFocus: (id: string) => void
  onChangingIdChange: (id: string | null) => void
  onLooksCorrect: (id: string) => void
  onConfirmChange: (id: string, targetId: string, label: EntityLabel) => void
  onLeaveUnmapped: (id: string) => void
  getLabel: (id: string | null | undefined) => EntityLabel
  busy?: boolean
}

export function AiMappingExceptionQueue({
  projectId,
  relationType,
  items,
  allSuggestions,
  focusedId,
  changingId,
  onFocus,
  onChangingIdChange,
  onLooksCorrect,
  onConfirmChange,
  onLeaveUnmapped,
  getLabel,
  busy,
}: AiMappingExceptionQueueProps) {
  const aiTargetsBySource = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of allSuggestions) {
      if (!s.targetId) continue
      const list = map.get(s.sourceId) ?? []
      if (!list.includes(s.targetId)) list.push(s.targetId)
      map.set(s.sourceId, list)
    }
    return map
  }, [allSuggestions])

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-neutral-200 px-4 py-8 text-center">
        <Typography tone="muted" size="sm">
          Nothing left to review. Apply the ready mappings when you are done.
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Typography variant="caption" tone="muted">
        Enter approve · C change · U leave unmapped · ↑↓ move
      </Typography>
      <ul className="space-y-2">
        {items.map((s) => {
          const source = getLabel(s.sourceId)
          const target = s.targetId ? getLabel(s.targetId) : null
          const focused = focusedId === s.id
          const changing = changingId === s.id
          const reason =
            s.evidence[0] ??
            s.warnings[0] ??
            (s.decision === 'AMBIGUOUS' ? 'Ambiguous match' : null)

          return (
            <li
              key={s.id}
              data-suggestion-id={s.id}
              className={cn(
                'border border-neutral-200 bg-white px-4 py-3',
                focused && 'ring-1 ring-neutral-800'
              )}
              onClick={() => onFocus(s.id)}
            >
              <Typography size="sm" weight="medium">
                {source.code} · {source.name}
              </Typography>

              <div className="mt-3">
                <Typography variant="caption" tone="muted" className="uppercase tracking-wide">
                  AI suggests
                </Typography>
                {target ? (
                  <Typography size="sm" className="mt-0.5 text-neutral-900">
                    {target.code} · {target.name}
                  </Typography>
                ) : (
                  <Typography size="sm" tone="muted" className="mt-0.5">
                    No match
                  </Typography>
                )}
              </div>

              <Typography variant="small" tone="muted" className="mt-2">
                {[s.confidenceBand ?? '—', reason].filter(Boolean).join(' · ')}
              </Typography>

              {changing ? (
                <AiMappingCandidatePicker
                  projectId={projectId}
                  relationType={relationType}
                  sourceId={s.sourceId}
                  aiTargetIds={aiTargetsBySource.get(s.sourceId) ?? []}
                  currentTargetId={s.targetId}
                  onClose={() => onChangingIdChange(null)}
                  onSelect={(label) => {
                    onConfirmChange(s.id, label.id, label)
                    onChangingIdChange(null)
                  }}
                  onLeaveUnmapped={() => {
                    void onLeaveUnmapped(s.id)
                    onChangingIdChange(null)
                  }}
                />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy || !s.targetId}
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation()
                      onLooksCorrect(s.id)
                    }}
                  >
                    Looks correct
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation()
                      onChangingIdChange(changingId === s.id ? null : s.id)
                    }}
                  >
                    Change mapping
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
