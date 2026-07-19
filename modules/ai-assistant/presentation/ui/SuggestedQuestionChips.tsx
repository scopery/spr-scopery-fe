'use client'

import { Button, Typography } from '@/shared/ui'

interface SuggestedQuestionChipsProps {
  questions: string[]
  loading?: boolean
  disabled?: boolean
  onSelect: (question: string) => void
  onExplainPage?: () => void
}

export function SuggestedQuestionChips({
  questions,
  loading = false,
  disabled = false,
  onSelect,
  onExplainPage,
}: SuggestedQuestionChipsProps) {
  if (loading) {
    return (
      <Typography variant="caption" tone="muted">
        Loading suggestions…
      </Typography>
    )
  }

  if (questions.length === 0 && !onExplainPage) return null

  return (
    <div className="flex flex-wrap gap-xs">
      {onExplainPage ? (
        <Button size="sm" variant="outline" disabled={disabled} onClick={onExplainPage}>
          Explain this page
        </Button>
      ) : null}
      {questions.slice(0, 6).map((q) => (
        <Button
          key={q}
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect(q)}
        >
          {q}
        </Button>
      ))}
    </div>
  )
}
