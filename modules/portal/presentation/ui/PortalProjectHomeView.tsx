'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Stack, Typography } from '@/shared/ui'

export function PortalProjectHomeView() {
  const { projectId } = useParams<{ projectId: string }>()

  const links = [
    { href: `/portal/projects/${projectId}/reviews`, label: 'Reviews' },
    { href: `/portal/projects/${projectId}/meetings`, label: 'Meetings' },
    { href: `/portal/projects/${projectId}/forms`, label: 'Forms' },
    { href: `/portal/projects/${projectId}/feedback`, label: 'Feedback' },
    { href: `/portal/projects/${projectId}/support`, label: 'Support' },
  ]

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Project home</Typography>
      <nav className="flex flex-wrap gap-md">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm underline">
            {l.label}
          </Link>
        ))}
      </nav>
    </Stack>
  )
}
