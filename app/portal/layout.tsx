'use client'

import type { ReactNode } from 'react'
import { FEATURES } from '@/config/features'
import { PortalShell } from '@/modules/portal/presentation/ui/PortalShell'
import { Stack, Typography } from '@/shared/ui'

export default function PortalLayout({ children }: { children: ReactNode }) {
  if (!FEATURES.clientPortal) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography variant="h2">Client portal unavailable</Typography>
        <Typography tone="muted">
          Portal access is disabled until the clientPortal feature flag is enabled.
        </Typography>
      </Stack>
    )
  }

  return <PortalShell>{children}</PortalShell>
}
