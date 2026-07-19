'use client'

import { FEATURES } from '@/config/features'
import { Typography } from '@/shared/ui'
import type { GovernanceStatusResult } from '../model/governance'

interface GovernanceStatusBannerProps {
  status: GovernanceStatusResult | null
}

export function GovernanceStatusBanner({ status }: GovernanceStatusBannerProps) {
  const feDisabled = !FEATURES.governanceEnforcement
  const serverDisabled = status && !status.enforcement_enabled

  if (!status && !feDisabled) {
    return (
      <Typography
        variant="small"
        tone="muted"
        className="border-border bg-muted/30 rounded border p-3"
      >
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

  const toneTextClass =
    tone === 'warning'
      ? 'text-amber-900'
      : tone === 'success'
        ? 'text-green-900'
        : 'text-muted-foreground'

  return (
    <div
      className={`rounded border p-3 ${
        tone === 'warning'
          ? 'border-amber-300 bg-amber-50'
          : tone === 'success'
            ? 'border-green-300 bg-green-50'
            : 'border-border bg-muted/30'
      }`}
    >
      <Typography variant="small" weight="medium" className={toneTextClass}>
        Enforcement status
      </Typography>
      <Typography variant="small" className={`mt-1 ${toneTextClass}`}>
        {message}
      </Typography>
      {status ? (
        <Typography size="xs" className={`mt-2 opacity-80 ${toneTextClass}`}>
          Active policies: {status.active_policy_count} · Active rules: {status.active_rule_count} ·
          Inactive policies: {status.inactive_policy_count}
        </Typography>
      ) : null}
    </div>
  )
}
