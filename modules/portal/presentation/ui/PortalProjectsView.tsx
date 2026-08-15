'use client'

import Link from 'next/link'
import { PageSkeleton, Stack, Typography } from '@/shared/ui'
import { usePortalProjects } from '../hooks/usePortalProjects'

export function PortalProjectsView() {
  const { items, loading, error } = usePortalProjects()

  if (loading) return <PageSkeleton variant="list" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md">
      <Typography as="h1" size="md" weight="medium">
        Your projects
      </Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((p) => (
          <li key={p.id} className="p-md">
            <Link href={`/portal/projects/${p.id}`} className="hover:underline">
              <Typography variant="small" weight="medium">
                {p.name}
              </Typography>
            </Link>
            <Typography variant="caption" tone="muted">
              {p.status}
            </Typography>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
