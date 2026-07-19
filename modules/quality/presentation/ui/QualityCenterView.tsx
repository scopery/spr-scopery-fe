'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useQualityCenter } from '../hooks/useQualityCenter'

export function QualityCenterView() {
  const params = useParams<{ workspaceId: string; projectId?: string }>()
  const scopeId = params.projectId ?? null
  const { items, loading, error, actionError, approve, markCurrent } = useQualityCenter(scopeId)

  if (loading) return <PageSkeleton variant="cards" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Quality Center</Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {items.length === 0 ? (
        <Typography tone="muted">No items yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {item.title}
                </Typography>
                {item.status ? (
                  <Typography variant="caption" tone="muted">
                    {item.status}
                  </Typography>
                ) : null}
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void approve(item.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void markCurrent(item.id)}>
                  Mark current
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
