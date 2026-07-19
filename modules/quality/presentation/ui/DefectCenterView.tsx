'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useDefects } from '../hooks/useDefects'

export function DefectCenterView() {
  const params = useParams<{ workspaceId: string; projectId?: string }>()
  const scopeId = params.projectId ?? null
  const { items, loading, error, actionError, close } = useDefects(scopeId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Defect Center</Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {items.length === 0 ? (
        <Typography tone="muted">No items yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {item.title ?? item.code ?? item.id}
                </Typography>
                {item.status ? (
                  <Typography variant="caption" tone="muted">
                    {[item.priority, item.status].filter(Boolean).join(' · ')}
                  </Typography>
                ) : null}
              </div>
              {item.status !== 'CLOSED' ? (
                <Button size="sm" variant="outline" onClick={() => void close(item.id)}>
                  Close
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
