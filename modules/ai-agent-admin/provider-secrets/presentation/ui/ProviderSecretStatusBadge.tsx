'use client'

import { Badge } from '@/shared/ui'
import { ProviderSecretStatus } from '../../domain/enums/provider-secret.enum'

export function ProviderSecretStatusBadge({ status }: { status: string }) {
  const tone =
    status === ProviderSecretStatus.Active
      ? 'success'
      : status === ProviderSecretStatus.Inactive
        ? 'neutral'
        : 'info'
  return <Badge tone={tone}>{status}</Badge>
}
