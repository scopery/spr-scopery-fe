'use client'

import { useParams } from 'next/navigation'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useAiRecommendations } from '../hooks/useAiRecommendations'

export function RecommendationCenterView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { items, loading, error, actionError, prepareInfo, accept, reject, prepareApply } =
    useAiRecommendations(projectId)

  if (loading) return <PageSkeleton variant="list" className="px-3 py-3 lg:px-4" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="sm" className="px-3 py-3 lg:px-4">
      <Typography as="h1" size="md" weight="medium">
        Recommendation Center
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {prepareInfo ? (
        <div className="border border-neutral-200 p-md">
          <Typography variant="small" weight="medium">
            Prepare-apply: {prepareInfo.suggestionRef}
          </Typography>
          <Typography variant="caption" tone={prepareInfo.ready ? 'muted' : 'error'}>
            {prepareInfo.ready
              ? 'Ready to apply'
              : `Not ready${prepareInfo.warnings?.length ? `: ${prepareInfo.warnings.join(', ')}` : ''}`}
          </Typography>
        </div>
      ) : null}
      {items.length === 0 ? (
        <Typography tone="muted">No recommendations.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-sm p-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Typography variant="small" weight="medium">
                  {item.title}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[item.status, item.severity].filter(Boolean).join(' · ')}
                  {item.summary ? ` — ${item.summary}` : ''}
                </Typography>
              </div>
              <div className="flex flex-wrap gap-xs">
                <Button size="sm" variant="ghost" onClick={() => void prepareApply(item)}>
                  Prepare apply
                </Button>
                <Button size="sm" variant="outline" onClick={() => void accept(item)}>
                  Accept
                </Button>
                <Button size="sm" tone="error" variant="outline" onClick={() => void reject(item)}>
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
