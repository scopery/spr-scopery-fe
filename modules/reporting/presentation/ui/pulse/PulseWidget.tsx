'use client'

import type { ReactNode } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

/** @deprecated Prefer PulseTextAction for widget CTAs */
export const pulseActionButtonClassName =
  'border-transparent bg-neutral-800 text-white hover:bg-neutral-900 active:bg-neutral-950'

export function PulsePanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('border border-neutral-200 bg-white', className)}>{children}</section>
  )
}

export function PulseWidget({
  title,
  children,
  className,
  footer,
}: {
  title: string
  children: ReactNode
  className?: string
  footer?: ReactNode
}) {
  return (
    <PulsePanel className={cn('flex h-full flex-col p-md', className)}>
      <Typography variant="h5" className="mb-sm">
        {title}
      </Typography>
      <div className="flex-1">{children}</div>
      {footer ? <div className="mt-sm">{footer}</div> : null}
    </PulsePanel>
  )
}

export function PulseEmpty({ children }: { children: ReactNode }) {
  return (
    <Typography variant="small" tone="muted">
      {children}
    </Typography>
  )
}

export function PulseTextAction({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <NextLink
      href={href}
      className="inline-flex items-center gap-xs text-sm font-medium text-primary underline-offset-2 hover:underline"
    >
      {children}
      <ArrowRight size={14} aria-hidden />
    </NextLink>
  )
}

export function PulseStatRows({
  rows,
}: {
  rows: Array<{ label: string; value: string }>
}) {
  if (rows.length === 0) return <PulseEmpty>No signals yet.</PulseEmpty>
  return (
    <Stack direction="vertical" spacing="xs">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-sm py-xs">
          <Typography variant="small" tone="muted">
            {row.label}
          </Typography>
          <Typography variant="small" className="font-semibold text-neutral-900">
            {row.value}
          </Typography>
        </div>
      ))}
    </Stack>
  )
}
