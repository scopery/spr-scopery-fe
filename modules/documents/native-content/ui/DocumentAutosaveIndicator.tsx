'use client'

import { cn } from '@/utils/cn'
import type { NativeEditorSaveStatus } from '../model/document-content'

const SAVE_COPY: Record<NativeEditorSaveStatus, string> = {
  idle: '',
  saved: 'Saved',
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
  conflict: 'Conflict detected',
  error: 'Save failed',
}

export function DocumentAutosaveIndicator({
  status,
  lastSavedAt,
  className,
}: {
  status: NativeEditorSaveStatus
  lastSavedAt?: string
  className?: string
}) {
  const label = SAVE_COPY[status]
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
