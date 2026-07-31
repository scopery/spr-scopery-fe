'use client'

import { Avatar, Badge, Typography } from '@/shared/ui'

interface IamEntityIdentityCardProps {
  title: string
  subtitle?: string | null
  meta?: string | null
  id: string
  avatarFallback?: string
  avatarSrc?: string | null
  badge?: string
}

function getAvatarInitial(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

export function IamEntityIdentityCard({
  title,
  subtitle,
  meta,
  id,
  avatarFallback,
  avatarSrc,
  badge,
}: IamEntityIdentityCardProps) {
  return (
    <div className="flex items-start gap-3">
      {avatarFallback || avatarSrc ? (
        <Avatar
          size="sm"
          src={avatarSrc ?? undefined}
          fallback={getAvatarInitial((avatarFallback ?? title) || id)}
          alt={title}
          className="shrink-0"
        />
      ) : null}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Typography size="sm" weight="medium" className="truncate">
            {title}
          </Typography>
          {badge ? <Badge>{badge}</Badge> : null}
        </div>
        {subtitle ? (
          <Typography variant="small" tone="muted" className="truncate">
            {subtitle}
          </Typography>
        ) : null}
        {meta ? (
          <Typography variant="small" tone="muted" className="truncate">
            {meta}
          </Typography>
        ) : null}
      </div>
    </div>
  )
}
