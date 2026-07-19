import React from 'react'
import { Lock, Shield, Eye, Globe } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '../Badge'
import {
  ClassificationLevel,
  type ClassificationBadgeProps,
} from './ClassificationBadge.types'

const CONFIG: Record<
  string,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'error'; Icon: typeof Globe }
> = {
  [ClassificationLevel.Public]: { label: 'Public', tone: 'neutral', Icon: Globe },
  [ClassificationLevel.Internal]: { label: 'Internal', tone: 'info', Icon: Eye },
  [ClassificationLevel.Confidential]: { label: 'Confidential', tone: 'warning', Icon: Shield },
  [ClassificationLevel.Restricted]: { label: 'Restricted', tone: 'error', Icon: Lock },
}

/**
 * ClassificationBadge — text + icon (never color-only) for data classification.
 */
export const ClassificationBadge = React.forwardRef<HTMLSpanElement, ClassificationBadgeProps>(
  ({ level, size = 'sm', className }, ref) => {
    const key = String(level).toUpperCase()
    const cfg = CONFIG[key] ?? {
      label: String(level),
      tone: 'neutral' as const,
      Icon: Shield,
    }
    const Icon = cfg.Icon

    return (
      <Badge
        ref={ref}
        variant="soft"
        tone={cfg.tone}
        size={size}
        className={cn('gap-xs', className)}
        aria-label={`Classification: ${cfg.label}`}
      >
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        <span>{cfg.label}</span>
      </Badge>
    )
  }
)

ClassificationBadge.displayName = 'ClassificationBadge'
