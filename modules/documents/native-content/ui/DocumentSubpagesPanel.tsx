'use client'

import { Stack, Typography } from '@/shared/ui'
import { FEATURES } from '@/config/features'

/**
 * W41-DOC-06 — sub-page tree. BE declares DOCUMENT_SUBPAGES path but has no controller yet.
 */
export function DocumentSubpagesPanel() {
  if (!FEATURES.wave41DocumentSubpages) {
    return (
      <Stack direction="vertical" spacing="xs" className="border border-neutral-200 p-sm">
        <Typography variant="h4">Sub-pages</Typography>
        <Typography variant="caption" tone="muted">
          Sub-page tree is not available yet (BE endpoint pending). Nested pages will appear here
          when the API ships.
        </Typography>
      </Stack>
    )
  }

  return null
}
