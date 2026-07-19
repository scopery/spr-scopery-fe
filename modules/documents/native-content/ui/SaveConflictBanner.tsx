'use client'

import { Button, Stack, Typography } from '@/shared/ui'

interface SaveConflictBannerProps {
  onKeepLocal: () => void
  onLoadServer: () => void
}

export function SaveConflictBanner({ onKeepLocal, onLoadServer }: SaveConflictBannerProps) {
  return (
    <div
      role="alert"
      className="border border-amber-300 bg-amber-50 px-md py-sm text-neutral-900"
    >
      <Stack direction="vertical" spacing="sm">
        <Typography variant="small" weight="medium">
          Someone else saved this document while you were editing.
        </Typography>
        <Typography variant="caption" tone="muted">
          Keep your local changes (will overwrite server after rebase), or load the server version
          and discard local edits.
        </Typography>
        <div className="flex flex-wrap gap-sm">
          <Button size="sm" variant="primary" onClick={onKeepLocal}>
            Keep my changes
          </Button>
          <Button size="sm" variant="outline" onClick={onLoadServer}>
            Load server version
          </Button>
        </div>
      </Stack>
    </div>
  )
}
