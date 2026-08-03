'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Typography } from '@/shared/ui'
import { Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  loadMappingCandidates,
  partitionCandidates,
  type MappingCandidate,
} from '../model/mapping-candidates'
import type {
  EntityLabel,
  MappingRelationType as MappingRelationTypeValue,
} from '../model/mapping-suggestions'

interface AiMappingCandidatePickerProps {
  projectId: string
  relationType: MappingRelationTypeValue
  sourceId: string
  /** Current AI-suggested target ids for this source (shown under AI Suggestions). */
  aiTargetIds: string[]
  currentTargetId: string | null
  onSelect: (candidate: EntityLabel) => void
  onClose: () => void
  onLeaveUnmapped?: () => void
}

export function AiMappingCandidatePicker({
  projectId,
  relationType,
  sourceId,
  aiTargetIds,
  currentTargetId,
  onSelect,
  onClose,
  onLeaveUnmapped,
}: AiMappingCandidatePickerProps) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<MappingCandidate[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoading(true)
      void loadMappingCandidates(projectId, relationType, sourceId, query)
        .then((list) => {
          if (!cancelled) setItems(list)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [projectId, relationType, sourceId, query])

  const { ai, rest } = useMemo(
    () => partitionCandidates(items, aiTargetIds),
    [items, aiTargetIds]
  )

  return (
    <div className="mt-2 border border-neutral-200 bg-neutral-50 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Typography size="sm" weight="medium">
          Change target
        </Typography>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <Input
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search code or name…"
        aria-label="Search candidates"
        prefix={<Search size={14} />}
      />
      <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
        {loading ? (
          <Typography variant="small" tone="muted">
            Loading…
          </Typography>
        ) : null}
        {ai.length > 0 ? (
          <CandidateSection
            title="AI suggestions"
            items={ai}
            currentTargetId={currentTargetId}
            onSelect={onSelect}
          />
        ) : null}
        <CandidateSection
          title="Recommended"
          items={rest}
          currentTargetId={currentTargetId}
          onSelect={onSelect}
        />
        {!loading && items.length === 0 ? (
          <Typography variant="small" tone="muted">
            No candidates match.
          </Typography>
        ) : null}
      </div>
      {onLeaveUnmapped ? (
        <div className="mt-2 border-t border-neutral-200 pt-2">
          <Button size="sm" variant="ghost" onClick={onLeaveUnmapped}>
            Leave unmapped
          </Button>
        </div>
      ) : (
        <Typography variant="caption" tone="muted" className="mt-2 block">
          Updates the draft only. Click Apply to write relations.
        </Typography>
      )}
    </div>
  )
}

function CandidateSection({
  title,
  items,
  currentTargetId,
  onSelect,
}: {
  title: string
  items: MappingCandidate[]
  currentTargetId: string | null
  onSelect: (candidate: EntityLabel) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <Typography
        variant="caption"
        tone="muted"
        className="mb-1 block text-[10px] uppercase tracking-wide"
      >
        {title}
      </Typography>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = item.id === currentTargetId
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  'flex w-full items-start gap-2 px-2 py-1.5 text-left text-sm',
                  active ? 'bg-secondary/15 text-neutral-900' : 'hover:bg-white'
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{item.code}</span>
                  <span className="text-neutral-500"> · {item.name}</span>
                </span>
                {active ? (
                  <span className="shrink-0 text-[10px] uppercase text-neutral-500">Current</span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
