'use client'

import { Lock } from 'lucide-react'
import { Typography } from '@/shared/ui'

interface ScopeLockBannerProps {
  sessionId: string | null
  onViewSession?: () => void
}

export function ScopeLockBanner({ sessionId, onViewSession }: ScopeLockBannerProps) {
  return (
    <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <Lock size={14} className="shrink-0" />
      <Typography variant="body" className="text-amber-800 text-base">
        Scope is locked — an elicitation session is in progress.
      </Typography>
      {sessionId && onViewSession && (
        <button
          type="button"
          onClick={onViewSession}
          className="ml-auto shrink-0 text-amber-700 underline hover:text-amber-900"
        >
          View Session
        </button>
      )}
    </div>
  )
}
