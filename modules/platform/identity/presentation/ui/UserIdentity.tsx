'use client'

import { Avatar, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { PersonIdentity, UserIdentityIdMode } from '../../domain/model/person-identity'
import { formatPersonLabel, personInitials } from '../../domain/rules/person-identity.rules'

export interface UserIdentityProps {
  userId: string | null | undefined
  /** Pre-resolved person (from useResolveUsers). */
  person?: PersonIdentity | null
  /** Optional override when person is not loaded yet (e.g. current user profile). */
  fallbackName?: string | null
  size?: 'xs' | 'sm' | 'md'
  /** Show email under the name when available. */
  showEmail?: boolean
  /** @deprecated Kept for compatibility. Raw IDs are never rendered. */
  showId?: UserIdentityIdMode
  className?: string
  /** Compact: avatar + name on one line, no email. */
  compact?: boolean
}

/**
 * People identity cell — avatar + display name (never raw UUID as the primary label).
 */
export function UserIdentity({
  userId,
  person,
  fallbackName,
  size = 'sm',
  showEmail = false,
  className,
  compact = false,
}: UserIdentityProps) {
  if (!userId) {
    return (
      <Typography variant="small" tone="muted" className={className}>
        —
      </Typography>
    )
  }

  const name =
    person?.fullName?.trim() ||
    fallbackName?.trim() ||
    person?.email?.trim() ||
    person?.username?.trim()

  if (!name) {
    return (
      <Typography variant="small" tone="muted" className={className}>
        —
      </Typography>
    )
  }

  const email = person?.email?.trim()
  const subtitle = showEmail && email && email !== name ? email : null

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar
        size={size}
        src={person?.avatarUrl ?? undefined}
        fallback={personInitials(name)}
        alt={name}
        className="shrink-0"
      />
      <div className="min-w-0">
        <Typography
          variant="small"
          weight="medium"
          className={cn('truncate', compact && 'leading-tight')}
          title={name}
        >
          {formatPersonLabel(
            person ??
              (fallbackName
                ? { id: userId, fullName: fallbackName, email: null, username: null }
                : null),
            userId
          )}
        </Typography>
        {subtitle && !compact ? (
          <Typography variant="caption" tone="muted" className="truncate" title={subtitle}>
            {subtitle}
          </Typography>
        ) : null}
      </div>
    </div>
  )
}
