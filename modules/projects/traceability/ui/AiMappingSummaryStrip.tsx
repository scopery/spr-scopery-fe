'use client'

import { Badge, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { MappingBucketCounts } from '../model/mapping-review.rules'
import { MappingReviewBucket } from '../model/mapping-suggestions'
import type { MappingFilterChip } from '../hooks/useMappingReview'

const CHIPS: Array<{ id: MappingFilterChip; label: string; countKey?: keyof MappingBucketCounts }> =
  [
    { id: 'ALL', label: 'All', countKey: 'total' },
    { id: MappingReviewBucket.Ready, label: 'Ready', countKey: 'ready' },
    { id: MappingReviewBucket.NeedsReview, label: 'Needs review', countKey: 'needsReview' },
    { id: MappingReviewBucket.Unmatched, label: 'Unmatched', countKey: 'unmatched' },
    { id: 'REMAP', label: 'Existing remap', countKey: 'remap' },
    { id: 'OUTDATED', label: 'Outdated', countKey: 'outdated' },
    { id: 'HAS_WARNING', label: 'Has warning', countKey: 'hasWarning' },
    { id: 'ACCEPTED', label: 'Accepted', countKey: 'accepted' },
    { id: 'REJECTED', label: 'Rejected', countKey: 'rejected' },
  ]

interface AiMappingSummaryStripProps {
  counts: MappingBucketCounts
  filter: MappingFilterChip
  onFilterChange: (filter: MappingFilterChip) => void
  runStatus?: string | null
  suggestionCount?: number | null
  sourceCount?: number | null
  scope?: string | null
}

export function AiMappingSummaryStrip({
  counts,
  filter,
  onFilterChange,
  runStatus,
  suggestionCount,
  sourceCount,
  scope,
}: AiMappingSummaryStripProps) {
  return (
    <div className="space-y-2 border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Typography weight="medium" size="sm">
          {counts.total} suggestion{counts.total === 1 ? '' : 's'}
        </Typography>
        <Typography variant="small" tone="muted">
          {counts.ready} ready · {counts.needsReview} need review · {counts.unmatched} unmatched
          {counts.remap > 0 ? ` · ${counts.remap} remap` : ''}
          {counts.outdated > 0 ? ` · ${counts.outdated} outdated` : ''}
          {counts.accepted > 0 ? ` · ${counts.accepted} accepted` : ''}
        </Typography>
        {runStatus ? (
          <Badge tone="neutral" className="text-[10px] uppercase">
            Run {runStatus}
          </Badge>
        ) : null}
        {scope ? (
          <Badge tone="neutral" className="text-[10px] uppercase">
            Scope {scope}
          </Badge>
        ) : null}
        {sourceCount != null || suggestionCount != null ? (
          <Typography variant="caption" tone="muted">
            Sources {sourceCount ?? '—'} · Generated {suggestionCount ?? '—'}
          </Typography>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1">
        {CHIPS.map((chip) => {
          const active = filter === chip.id
          const count = chip.countKey ? counts[chip.countKey] : undefined
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onFilterChange(chip.id)}
              className={cn(
                'border px-2.5 py-1 text-xs transition-colors',
                active
                  ? 'border-neutral-800 bg-neutral-800 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
              )}
            >
              {chip.label}
              {count != null ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
