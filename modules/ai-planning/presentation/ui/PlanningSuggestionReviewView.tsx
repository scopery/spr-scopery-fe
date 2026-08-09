'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BeforeAfterDiff,
  Button,
  GovernedObjectBadge,
  PageSkeleton,
  Stack,
  Typography,
} from '@/shared/ui'

import { usePlanningSuggestions } from '../hooks/usePlanningSuggestions'
import { SuggestionDecision } from '../../domain/enums/ai-planning.enum'

export function PlanningSuggestionReviewView() {
  const { projectId, runId } = useParams<{ projectId: string; runId: string }>()
  const { items, loading, error, actionError, previewApply, apply, accept } =
    usePlanningSuggestions(projectId, runId)
  const [preview, setPreview] = useState<{
    suggestionId: string
    fields: Array<{ path: string; label: string; before: string | null; after: string | null }>
    requiresChangeRequest?: boolean
  } | null>(null)

  if (loading) return <PageSkeleton variant="detail" className="px-3 py-3 lg:px-4" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="sm" className="px-3 py-3 lg:px-4">
      <Typography as="h1" size="md" weight="medium">
        Planning suggestion review
      </Typography>
      <Typography variant="small" tone="muted">
        States: suggested → accepted → applied. Baseline-guarded projects may require a Change
        Request before apply.
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {preview ? (
        <div className="border border-neutral-200 p-md">
          <Typography variant="h4" className="mb-sm">
            Apply preview
          </Typography>
          {preview.requiresChangeRequest ? (
            <GovernedObjectBadge baselineGuarded className="mb-sm" />
          ) : null}
          <BeforeAfterDiff fields={preview.fields} />
          <div className="mt-sm flex gap-sm">
            <Button
              size="sm"
              disabled={preview.requiresChangeRequest}
              title={
                preview.requiresChangeRequest
                  ? 'Create a Change Request before applying'
                  : undefined
              }
              onClick={() => {
                void apply(preview.suggestionId).then((res) => {
                  if (res) setPreview(null)
                })
              }}
            >
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-md p-md">
            <div>
              <Typography variant="small" weight="medium">
                {s.title}
              </Typography>
              <Typography variant="caption" tone="muted">
                {s.status}
                {s.suggestionType ? ` · ${s.suggestionType.replace(/_/g, ' ')}` : ''}
                {s.summary ? ` · ${s.summary}` : ''}
              </Typography>
              {s.rationale ? (
                <Typography variant="caption" tone="muted" className="mt-xs italic">
                  {s.rationale}
                </Typography>
              ) : null}
            </div>
            <div className="flex gap-xs">
              <Button size="sm" variant="ghost" onClick={() => void accept(s.id)}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void previewApply(s.id).then((res) => {
                    if (res) {
                      setPreview({
                        suggestionId: s.id,
                        fields: res.fields.length
                          ? res.fields
                          : [
                              {
                                path: 'status',
                                label: 'State',
                                before: s.status,
                                after: SuggestionDecision.Applied,
                              },
                            ],
                        requiresChangeRequest:
                          res.requiresChangeRequest ?? Boolean(s.requiresChangeRequest),
                      })
                      return
                    }
                    setPreview({
                      suggestionId: s.id,
                      fields: [
                        {
                          path: 'status',
                          label: 'State',
                          before: s.status,
                          after: SuggestionDecision.Applied,
                        },
                      ],
                      requiresChangeRequest: Boolean(s.requiresChangeRequest),
                    })
                  })
                }}
              >
                Preview apply
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
