'use client'

import NextLink from 'next/link'
import { Button, Stack, Typography } from '@/shared/ui'
import { ADMIN_ROUTES } from '@/modules/admin'

interface AiControlPlaceholderViewProps {
  title: string
  description: string
  phaseHint: string
}

/** Thin stub for AI Control Center list pages until their W5 phase ships. */
export function AiControlPlaceholderView({
  title,
  description,
  phaseHint,
}: AiControlPlaceholderViewProps) {
  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div>
        <Typography variant="h2">{title}</Typography>
        <Typography variant="caption" tone="muted" className="mt-1 block">
          {description}
        </Typography>
      </div>
      <div className="border border-neutral-200 p-md">
        <Typography variant="small">
          This surface is scaffolded for Wave 5 route coverage. Full CRUD ships in{' '}
          <strong>{phaseHint}</strong>.
        </Typography>
        <div className="mt-md">
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlOverview} size="sm" variant="outline">
            Back to overview
          </Button>
        </div>
      </div>
      <Typography variant="caption" tone="muted">
        No static/mock counts are shown here.
      </Typography>
    </Stack>
  )
}
