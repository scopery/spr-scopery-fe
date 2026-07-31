'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageSkeleton, Stack, Typography } from '@/shared/ui'
import { usePortalSupport } from '../hooks/usePortalSupport'

export function PortalSupportView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { items, loading, error } = usePortalSupport(projectId)

  if (loading) return <PageSkeleton variant="list" className="px-3 py-3 lg:px-4 lg:py-3" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <Link href={`/portal/projects/${projectId}`} className="text-sm underline">
        ← Project home
      </Link>
      <Typography as="h1" size="md" weight="medium">
        Support
      </Typography>
      {items.length === 0 ? (
        <Typography tone="muted">No support cases.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((c) => (
            <li key={c.id} className="p-md">
              <Typography variant="small" weight="medium">
                {c.title}
              </Typography>
              <Typography variant="caption" tone="muted">
                {c.status}
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
