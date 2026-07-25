'use client'

import { cn } from '@/utils/cn'
import type { NativeEditorSaveStatus } from '../model/document-content'

function labelFor(
  status: NativeEditorSaveStatus,
  autosaveInSeconds: number | null | undefined
): string {
  switch (status) {
    case 'idle':
      return ''
    case 'saved':
      return 'Saved'
    case 'saving':
      return 'Saving…'
    case 'unsaved':
      return autosaveInSeconds != null
        ? `Autosave in ${autosaveInSeconds}s`
        : 'Unsaved changes'
    case 'conflict':
      return 'Conflict detected'
    case 'error':
      return 'Save failed'
  }
}

export function DocumentAutosaveIndicator({
  status,
  lastSavedAt,
  autosaveInSeconds,
  className,
}: {
  status: NativeEditorSaveStatus
  lastSavedAt?: string
  autosaveInSeconds?: number | null
  className?: string
}) {
  const label = labelFor(status, autosaveInSeconds)
  if (!label && !lastSavedAt) return null

  return (
    <span
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        status === 'conflict' || status === 'error'
          ? 'text-error'
          : status === 'unsaved'
            ? 'text-warning'
            : 'text-neutral-500',
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          status === 'saving' && 'animate-pulse bg-primary',
          status === 'saved' && 'bg-success',
          status === 'unsaved' && 'bg-warning',
          status === 'conflict' && 'bg-error',
          status === 'error' && 'bg-error',
          status === 'idle' && 'bg-neutral-300'
        )}
        aria-hidden
      />
      <span>
        {label}
        {status === 'saved' && lastSavedAt
          ? ` · ${new Date(lastSavedAt).toLocaleTimeString()}`
          : null}
      </span>
    </span>
  )
}
