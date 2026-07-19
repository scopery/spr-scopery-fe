import React from 'react'
import { cn } from '@/utils/cn'
import { Switch } from '../../atoms/Switch'
import { Typography } from '../../atoms/Typography'
import { Stack } from '../../atoms/Stack'
import type { ClientVisibilityToggleProps } from './ClientVisibilityToggle.types'

/**
 * ClientVisibilityToggle — explains exactly what external clients will see.
 */
export function ClientVisibilityToggle({
  visibleToClient,
  onChange,
  explanation,
  disabled,
  className,
}: ClientVisibilityToggleProps) {
  return (
    <Stack direction="vertical" spacing="xs" className={cn(className)}>
      <div className="flex items-center justify-between gap-md">
        <Typography variant="small" weight="medium">
          Visible to client
        </Typography>
        <Switch
          checked={visibleToClient}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          aria-label="Visible to client"
        />
      </div>
      <Typography variant="caption" tone="muted">
        {explanation ??
          (visibleToClient
            ? 'External portal users with access can see this item.'
            : 'Hidden from the client portal. Internal users only.')}
      </Typography>
    </Stack>
  )
}

ClientVisibilityToggle.displayName = 'ClientVisibilityToggle'
