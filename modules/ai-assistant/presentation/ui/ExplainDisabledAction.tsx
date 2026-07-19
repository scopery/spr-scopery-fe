'use client'

import { Button, Typography } from '@/shared/ui'

interface ExplainDisabledActionProps {
  actionCode: string
  label?: string
  /** Visual disabled primary control (not the only interactive element). */
  children: React.ReactNode
  onExplain: (actionCode: string, label?: string) => void
}

/**
 * Disabled actions still need an accessible explanation trigger.
 * Native disabled buttons alone cannot receive click/focus for "why?".
 */
export function ExplainDisabledAction({
  actionCode,
  label,
  children,
  onExplain,
}: ExplainDisabledActionProps) {
  return (
    <div className="inline-flex flex-col items-start gap-xs">
      <div aria-disabled="true" className="pointer-events-none opacity-50">
        {children}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onExplain(actionCode, label)}
      >
        <Typography as="span" variant="caption" tone="muted">
          Why is this disabled?
        </Typography>
      </Button>
    </div>
  )
}
