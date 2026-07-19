'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useReleases } from '../hooks/useReleases'

export function ReleaseCenterView() {
  const params = useParams<{ workspaceId: string; projectId?: string }>()
  const scopeId = params.projectId ?? null
  const {
    items,
    loading,
    error,
    actionError,
    readiness,
    checkReadiness,
    markReady,
    markAsReleased,
  } = useReleases(scopeId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Release Center</Typography>
      <Typography tone="muted" variant="caption">
        Lifecycle actions are not optimistic — confirm via API before UI updates.
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {items.length === 0 ? (
        <Typography tone="muted">No items yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => {
            const ready = readiness[item.id]
            return (
              <li key={item.id} className="flex flex-col gap-sm p-md">
                <div className="flex items-center justify-between gap-md">
                  <div>
                    <Typography variant="small" weight="medium">
                      {item.title ?? item.id}
                    </Typography>
                    {item.status ? (
                      <Typography variant="caption" tone="muted">
                        {item.status}
                      </Typography>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-xs">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void checkReadiness(item.id)}
                    >
                      Check readiness
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void markReady(item.id)}>
                      Mark ready
                    </Button>
                    <Button size="sm" onClick={() => void markAsReleased(item.id)}>
                      Mark released
                    </Button>
                  </div>
                </div>
                {ready ? (
                  <Typography variant="caption" tone={ready.ready ? 'muted' : 'error'}>
                    {ready.ready
                      ? 'Ready'
                      : `Blockers: ${(ready.blockers ?? []).join(', ') || 'not ready'}`}
                  </Typography>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Stack>
  )
}
