'use client'

import type { ReactNode } from 'react'
import { Button, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

interface InsightWidgetShellProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
  bodyClassName?: string
  loading?: boolean
  error?: string | null
  empty?: string | null
  onRetry?: () => void
  children: ReactNode
}

export function InsightWidgetShell({
  title,
  subtitle,
  action,
  className,
  bodyClassName,
  loading,
  error,
  empty,
  onRetry,
  children,
}: InsightWidgetShellProps) {
  return (
    <section className={cn('rounded-none border border-neutral-200 bg-white', className)}>
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div className="min-w-0">
          <Typography as="h2" size="sm" weight="semibold" className="text-neutral-900">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="small" tone="muted" className="mt-0.5">
              {subtitle}
            </Typography>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn('p-4', bodyClassName)}>
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            <div className="h-3 w-2/3 bg-neutral-100" />
            <div className="h-3 w-1/2 bg-neutral-100" />
            <div className="h-24 w-full bg-neutral-50" />
          </div>
        ) : error ? (
          <div className="space-y-2">
            <Typography variant="small" className="text-error">
              {error}
            </Typography>
            {onRetry ? (
              <Button variant="outline" size="sm" className="rounded-none" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : empty ? (
          <Typography variant="small" tone="muted">
            {empty}
          </Typography>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
