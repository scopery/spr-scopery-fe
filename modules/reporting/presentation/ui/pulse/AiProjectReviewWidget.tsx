'use client'

import { useMemo, useState } from 'react'
import { Button, Checkbox, Stack, Typography } from '@/shared/ui'
import type { AiProjectReviewInsight } from '../../../domain/model/project-pulse'
import { PulsePanel, PulseTextAction } from './PulseWidget'

export function AiProjectReviewWidget({
  insight,
  onReviewSelected,
}: {
  insight: AiProjectReviewInsight
  onReviewSelected?: (ids: string[]) => void
}) {
  const initial = useMemo(
    () =>
      new Set(insight.actions.filter((action) => action.defaultSelected).map((action) => action.id)),
    [insight.actions]
  )
  const [selected, setSelected] = useState<Set<string>>(initial)

  if (!insight.available || insight.actions.length === 0) return null

  const selectedCount = selected.size

  return (
    <PulsePanel>
      <div className="space-y-md p-md">
        <Typography variant="h5">AI Project Review</Typography>
        <div>
          <Typography variant="overline" tone="muted">
            Overall
          </Typography>
          <Typography variant="body" className="text-neutral-900">
            {insight.overall}
          </Typography>
        </div>

        {insight.why.length > 0 ? (
          <div>
            <Typography variant="overline" tone="muted">
              Why
            </Typography>
            <ul className="mt-xs space-y-xs">
              {insight.why.map((reason) => (
                <li key={reason}>
                  <Typography variant="small" className="text-neutral-800">
                    {reason}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <Typography variant="overline" tone="muted">
            Suggested actions
          </Typography>
          <Typography variant="caption" tone="muted" className="mb-sm block">
            AI only proposes. Nothing is applied until you review.
          </Typography>
          <Stack direction="vertical" spacing="sm">
            {insight.actions.map((action) => (
              <label
                key={action.id}
                className="flex cursor-pointer items-start gap-sm border border-neutral-200 bg-neutral-50 p-sm"
              >
                <Checkbox
                  checked={selected.has(action.id)}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setSelected((prev) => {
                      const next = new Set(prev)
                      if (checked) next.add(action.id)
                      else next.delete(action.id)
                      return next
                    })
                  }}
                  aria-label={action.title}
                />
                <span className="min-w-0 flex-1">
                  <Typography variant="small" className="font-semibold text-neutral-900">
                    {action.title}
                  </Typography>
                  <Typography variant="caption" className="block text-neutral-600">
                    {action.detail}
                  </Typography>
                  {action.href ? (
                    <PulseTextAction href={action.href}>Open related screen</PulseTextAction>
                  ) : null}
                </span>
              </label>
            ))}
          </Stack>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={selectedCount === 0}
          onClick={() => onReviewSelected?.(Array.from(selected))}
        >
          Review {selectedCount} selected suggestion{selectedCount === 1 ? '' : 's'}
        </Button>
      </div>
    </PulsePanel>
  )
}

