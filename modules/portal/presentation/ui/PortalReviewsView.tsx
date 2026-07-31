'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { usePortalReviews } from '../hooks/usePortalReviews'

export function PortalReviewsView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { items, loading, error, actionError, decide } = usePortalReviews(projectId)

  if (loading) return <PageSkeleton variant="list" className="px-3 py-3 lg:px-4 lg:py-3" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <Link href={`/portal/projects/${projectId}`} className="text-sm underline">
        ← Project home
      </Link>
      <Typography as="h1" size="md" weight="medium">
        Reviews
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {items.length === 0 ? (
        <Typography tone="muted">No reviews assigned.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-sm p-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Typography variant="small" weight="medium">
                  {r.title}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {r.status}
                </Typography>
              </div>
              <div className="flex flex-wrap gap-xs">
                <Button size="sm" variant="outline" onClick={() => void decide(r.id, 'APPROVED')}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void decide(r.id, 'REVISION_REQUESTED')}
                >
                  Request revision
                </Button>
                <Button
                  size="sm"
                  tone="error"
                  variant="outline"
                  onClick={() => void decide(r.id, 'REJECTED')}
                >
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
