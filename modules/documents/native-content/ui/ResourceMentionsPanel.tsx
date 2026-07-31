'use client'

import { Stack, Typography } from '@/shared/ui'

export function ResourceMentionsPanel({
  onInsertMention,
}: {
  onInsertMention?: (resourceType: string, resourceId: string, label: string) => void
}) {
  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">Mentions</Typography>
      <Typography variant="caption" tone="muted">
        Resource mention search is not exposed by the backend yet. Mention insertion will be enabled
        when selectable mention candidates are available.
      </Typography>
      {onInsertMention ? null : (
        <Typography variant="caption" tone="muted">
          This editor does not support mention insertion.
        </Typography>
      )}
    </Stack>
  )
}
