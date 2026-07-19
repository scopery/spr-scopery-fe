'use client'

import { useParams } from 'next/navigation'
import {
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useProjectDashboard } from '../hooks/useProjectDashboard'

export function ProjectDashboardView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, reports, activity, loading, error } = useProjectDashboard(projectId)

  if (loading) return <PageSkeleton variant="cards" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Project Dashboard</Typography>
      {!data || data.metrics.length === 0 ? (
        <Typography tone="muted">No dashboard metrics available.</Typography>
      ) : (
        <div className="grid grid-cols-2 gap-md md:grid-cols-4">
          {data.metrics.map((m) => (
            <div key={m.key} className="border border-neutral-200 p-md">
              <Typography variant="caption" tone="muted">
                {m.label}
              </Typography>
              <Typography variant="h3">{m.value}</Typography>
            </div>
          ))}
        </div>
      )}

      <Typography variant="h4">Project reports</Typography>
      <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
        {Object.entries(reports).map(([key, value]) => (
          <div key={key} className="border border-neutral-200 p-md">
            <Typography variant="caption" tone="muted">
              {key}
            </Typography>
            <Typography variant="small">
              {Object.keys(value).length === 0 ? 'No data' : `${Object.keys(value).length} fields`}
            </Typography>
          </div>
        ))}
      </div>

      <Typography variant="h4">Activity feed</Typography>
      {activity.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No activity.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {activity.map((a) => (
            <li key={a.id} className="p-md text-sm">
              {[a.summary ?? a.id, a.createdAt].filter(Boolean).join(' · ')}
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
