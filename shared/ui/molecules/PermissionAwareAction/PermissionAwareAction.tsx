import React from 'react'
import { cn } from '@/utils/cn'
import { Typography } from '../../atoms/Typography'
import {
  PermissionActionState,
  type PermissionAwareActionProps,
} from './PermissionAwareAction.types'

/**
 * PermissionAwareAction — wraps actions with allowed/disabled/hidden/elevated/reauth.
 */
export function PermissionAwareAction({
  state,
  reason,
  children,
  className,
}: PermissionAwareActionProps) {
  if (state === PermissionActionState.Hidden) return null

  if (state === PermissionActionState.Allowed) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={cn('inline-flex flex-col gap-xs', className)}
      title={reason}
      aria-disabled={state === PermissionActionState.Disabled}
    >
      <div className="pointer-events-none opacity-50">{children}</div>
      {reason ? (
        <Typography variant="caption" tone="muted">
          {reason}
        </Typography>
      ) : null}
    </div>
  )
}

PermissionAwareAction.displayName = 'PermissionAwareAction'
