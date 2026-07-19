'use client'

import { Button, DetailDrawer, Typography } from '@/shared/ui'

interface GuideDrawerProps {
  open: boolean
  title: string
  streamingText: string
  streaming: boolean
  error: string | null
  suggestedQuestions?: string[]
  onClose: () => void
  onAskFollowUp?: (question: string) => void
}

export function GuideDrawer({
  open,
  title,
  streamingText,
  streaming,
  error,
  suggestedQuestions = [],
  onClose,
  onAskFollowUp,
}: GuideDrawerProps) {
  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={title || 'AI Guide'}
      subtitle={streaming ? 'Streaming…' : 'Contextual help'}
      size="md"
    >
      {error ? (
        <Typography tone="error" variant="small" className="mb-sm block">
          {error}
        </Typography>
      ) : null}
      {streamingText ? (
        <Typography variant="small" className="whitespace-pre-wrap">
          {streamingText}
        </Typography>
      ) : (
        <Typography variant="small" tone="muted">
          {streaming ? 'Waiting for explanation…' : 'No explanation yet.'}
        </Typography>
      )}

      {!streaming && suggestedQuestions.length > 0 ? (
        <div className="mt-md">
          <Typography variant="caption" tone="muted" className="mb-sm block">
            Suggested follow-ups
          </Typography>
          <div className="flex flex-wrap gap-xs">
            {suggestedQuestions.slice(0, 5).map((q) => (
              <Button
                key={q}
                size="sm"
                variant="outline"
                onClick={() => onAskFollowUp?.(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
