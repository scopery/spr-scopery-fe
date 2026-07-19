import React from 'react'
import { Lock, CheckCircle2, ShieldAlert, User } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '../../atoms/Badge'
import { Stack } from '../../atoms/Stack'
import type { GovernedObjectBadgeProps } from './GovernedObjectBadge.types'

/**
 * GovernedObjectBadge — owner / lock / finalize / baseline / restricted / version chips.
 */
export function GovernedObjectBadge({
  ownerLabel,
  locked,
  finalized,
  baselineGuarded,
  restrictedAccess,
  versionLabel,
  className,
}: GovernedObjectBadgeProps) {
  return (
    <Stack direction="horizontal" spacing="xs" className={cn('flex-wrap', className)}>
      {ownerLabel ? (
        <Badge variant="soft" tone="neutral" size="sm" aria-label={`Owner: ${ownerLabel}`}>
          <User className="h-3 w-3" aria-hidden />
          {ownerLabel}
        </Badge>
      ) : null}
      {locked ? (
        <Badge variant="soft" tone="warning" size="sm" aria-label="Locked">
          <Lock className="h-3 w-3" aria-hidden />
          Locked
        </Badge>
      ) : null}
      {finalized ? (
        <Badge variant="soft" tone="success" size="sm" aria-label="Finalized">
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Finalized
        </Badge>
      ) : null}
      {baselineGuarded ? (
        <Badge variant="soft" tone="info" size="sm" aria-label="Baseline guarded">
          <ShieldAlert className="h-3 w-3" aria-hidden />
          Baseline
        </Badge>
      ) : null}
      {restrictedAccess ? (
        <Badge variant="soft" tone="error" size="sm" aria-label="Restricted access">
          Restricted
        </Badge>
      ) : null}
      {versionLabel ? (
        <Badge variant="outline" tone="neutral" size="sm" aria-label={`Version ${versionLabel}`}>
          {versionLabel}
        </Badge>
      ) : null}
    </Stack>
  )
}

GovernedObjectBadge.displayName = 'GovernedObjectBadge'
