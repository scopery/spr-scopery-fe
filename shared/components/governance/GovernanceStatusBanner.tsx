'use client'

import { FEATURES } from '@/config/features'
import { Typography } from '@/shared/ui'
import type { GovernanceStatusResult } from '@/types/governance'

interface GovernanceStatusBannerProps {
  status: GovernanceStatusResult | null
}

export function GovernanceStatusBanner({ status }: GovernanceStatusBannerProps) {
  const feDisabled = !FEATURES.governanceEnforcement
  const serverDisabled = status && !status.enforcement_enabled

  if (!status && !feDisabled) {
    return (
      <Typography variant="small" tone="muted" className="rounded border border-border bg-muted/30 p-3">
        Policies are enforced by the server when governance enforcement is enabled.
      </Typography>
    )
  }

  const tone =
    serverDisabled || feDisabled
      ? 'warning'
      : status && status.active_policy_count > 0
        ? 'success'
        : 'muted'

  const message =
    status?.message ??
    (feDisabled
      ? 'Governance policies can be configured, but server-side enforcement may be disabled.'
      : 'Policies are enforced by the server when governance enforcement is enabled.')

  return (
    <div
      className={`rounded border p-3 text-sm ${
        tone === 'warning'
          ? 'border-amber-300 bg-amber-50 text-amber-900'
          : tone === 'success'
            ? 'border-green-300 bg-green-50 text-green-900'
            : 'border-border bg-muted/30 text-muted-foreground'
      }`}
    >
      <div className="font-medium">Enforcement status</div>
      <div className="mt-1">{message}</div>
      {status ? (
        <div className="mt-2 text-xs opacity-80">
          Active policies: {status.active_policy_count} · Active rules: {status.active_rule_count} ·
          Inactive policies: {status.inactive_policy_count}
        </div>
      ) : null}
    </div>
  )
}
