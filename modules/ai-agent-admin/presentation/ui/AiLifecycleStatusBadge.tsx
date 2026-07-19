'use client'

import { Badge } from '@/shared/ui'

export function AiLifecycleStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'ACTIVE' || status === 'SUCCEEDED'
      ? 'success'
      : status === 'DEPRECATED' || status === 'ARCHIVED' || status === 'CANCELLED'
        ? 'warning'
        : status === 'FAILED'
          ? 'error'
          : status === 'DRAFT' || status === 'PENDING' || status === 'RUNNING'
            ? 'info'
            : status === 'INACTIVE'
              ? 'neutral'
              : 'info'
  return <Badge tone={tone}>{status}</Badge>
}


