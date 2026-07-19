'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '../../atoms/Button'
import { Stack } from '../../atoms/Stack'
import { Typography } from '../../atoms/Typography'
import { cn } from '@/utils/cn'
import type { ErrorFallbackProps } from './ErrorFallback.types'

export function ErrorFallback({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. You can try again or return to the home page.',
  detail,
  onRetry,
  retryLabel = 'Try again',
  homeHref = '/',
  homeLabel = 'Go to home',
  className,
}: ErrorFallbackProps) {
  const showDetail = detail && process.env.NODE_ENV !== 'production'

  return (
    <main
      className={cn(
        'flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12',
        className
      )}
    >
      <Stack direction="vertical" spacing="md" className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
          <AlertTriangle size={24} aria-hidden />
        </div>

        <Typography as="h1" size="lg" weight="semibold" className="text-neutral-900">
          {title}
        </Typography>

        <Typography tone="muted" className="text-sm leading-relaxed">
          {message}
        </Typography>

        {showDetail && (
          <Typography
            as="p"
            variant="small"
            tone="muted"
            className="break-all rounded border border-neutral-200 bg-white p-3 text-left font-mono"
          >
            {detail}
          </Typography>
        )}

        <Stack direction="horizontal" spacing="sm" className="justify-center pt-2">
          {onRetry && (
            <Button type="button" variant="primary" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = homeHref
            }}
          >
            {homeLabel}
          </Button>
        </Stack>
      </Stack>
    </main>
  )
}
