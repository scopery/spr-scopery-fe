'use client'

import { Button, Stack, Typography } from '@/shared/ui'
import type { ResolvedResource } from '../model/intelligence'

export function MentionAccessBanner({
  revoked,
  checking,
  mentionCount,
}: {
  revoked: ResolvedResource[]
  checking: boolean
  mentionCount: number
}) {
  if (!mentionCount && !checking) return null

  if (checking && !mentionCount) {
    return (
      <Typography variant="caption" tone="muted">
        Checking mention access…
      </Typography>
    )
  }

  if (!revoked.length) {
    return (
      <Typography variant="caption" tone="muted">
        {mentionCount} mention{mentionCount === 1 ? '' : 's'} accessible
      </Typography>
    )
  }

  return (
    <Stack
      direction="vertical"
      spacing="xs"
      className="border border-warning/40 bg-warning/10 p-sm"
      role="status"
    >
      <Typography variant="small" weight="medium">
        {revoked.length} mention{revoked.length === 1 ? '' : 's'} inaccessible
      </Typography>
      <Typography variant="caption" tone="muted">
        Mentions do not grant access. Revoked or missing resources show as [Access Revoked].
      </Typography>
      <ul className="text-xs text-neutral-700">
        {revoked.slice(0, 5).map((r) => (
          <li key={`${r.resourceType}-${r.resourceId}`}>
            [{r.status === 'NOT_FOUND' ? 'Not Found' : 'Access Revoked'}]{' '}
            {r.displayName ?? r.resourceType}
          </li>
        ))}
      </ul>
    </Stack>
  )
}

export function MentionAccessActions({
  onOpenMentions,
}: {
  onOpenMentions: () => void
}) {
  return (
    <Button size="sm" variant="ghost" onClick={onOpenMentions}>
      Open mentions
    </Button>
  )
}
