'use client'

import { Badge } from '@/shared/ui'
import { ProviderStatus } from '../../domain/enums/provider.enum'

function toneFor(
  status: string
): 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  switch (status) {
    case ProviderStatus.Active:
      return 'success'
    case ProviderStatus.Inactive:
      return 'neutral'
    case ProviderStatus.Deprecated:
      return 'warning'
    default:
      return 'info'
  }
}

export function ProviderStatusBadge({ status }: { status: string }) {
  return <Badge tone={toneFor(status)}>{status}</Badge>
}
