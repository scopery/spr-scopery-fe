'use client'

import { useParams } from 'next/navigation'
import {
  GovernedObjectBadge,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useAiPlanning } from '../hooks/useAiPlanning'

export function AiPlanningCenterView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { items, loading, error } = useAiPlanning(projectId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">AI Planning Center</Typography>
      <Typography tone="muted">
        Review suggestions as suggested / accepted / applied. Baseline-guarded projects may
        require a Change Request before apply.
      </Typography>
      {items.length === 0 ? (
        <Typography tone="muted">No planning runs yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((run) => (
            <li key={run.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {run.title ?? run.id}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {run.status}
                </Typography>
              </div>
              <GovernedObjectBadge baselineGuarded />
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
