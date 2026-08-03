'use client'

import { useState } from 'react'
import { Button, Typography } from '@/shared/ui'
import type { EntityLabel, MappingSuggestion } from '../model/mapping-suggestions'
import { isRemapCandidate, isStaleSuggestion } from '../model/mapping-phase3.rules'

interface AiMappingExistingCompareProps {
  suggestion: MappingSuggestion
  getLabel: (id: string | null | undefined) => EntityLabel
  onKeepCurrent: (suggestionId: string) => void
  onReplace: (suggestionId: string) => void
  disabled?: boolean
}

export function AiMappingExistingCompare({
  suggestion,
  getLabel,
  onKeepCurrent,
  onReplace,
  disabled,
}: AiMappingExistingCompareProps) {
  const [open, setOpen] = useState(false)

  if (isStaleSuggestion(suggestion)) {
    return (
      <div className="mt-2 border border-amber-200 bg-amber-50 px-2.5 py-2">
        <Typography size="sm" weight="medium" className="text-amber-900">
          Outdated
        </Typography>
        <Typography variant="small" className="mt-0.5 text-amber-800">
          Source or target changed after this suggestion was generated. Regenerate, or dismiss.
        </Typography>
      </div>
    )
  }

  if (!isRemapCandidate(suggestion)) return null

  const current = getLabel(suggestion.currentTargetId)
  const suggested = getLabel(suggestion.targetId)

  return (
    <div className="mt-2 border border-neutral-200 bg-neutral-50 px-2.5 py-2">
      <Typography size="sm" weight="medium">
        Existing mapping review
      </Typography>
      <Typography variant="small" tone="muted" className="mt-0.5">
        Source already has a parent. Choose keep or replace.
      </Typography>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="border border-neutral-200 bg-white px-2 py-1.5">
          <Typography variant="caption" tone="muted" className="block uppercase">
            Current
          </Typography>
          <Typography size="sm" className="truncate">
            {current.code} · {current.name}
          </Typography>
        </div>
        <div className="border border-secondary/30 bg-white px-2 py-1.5">
          <Typography variant="caption" tone="muted" className="block uppercase">
            Suggested
          </Typography>
          <Typography size="sm" className="truncate">
            {suggested.code} · {suggested.name}
          </Typography>
        </div>
      </div>
      {open ? (
        <div className="mt-2 space-y-1 text-xs text-neutral-600">
          {suggestion.evidence.map((e) => (
            <p key={e}>{e}</p>
          ))}
          {suggestion.reasonCodes.length > 0 ? (
            <p>
              <span className="font-medium">Reasons: </span>
              {suggestion.reasonCodes.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={() => onKeepCurrent(suggestion.id)}
        >
          Keep current
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled}
          onClick={() => onReplace(suggestion.id)}
        >
          Replace mapping
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide compare' : 'Compare'}
        </Button>
      </div>
    </div>
  )
}
