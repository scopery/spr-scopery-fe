'use client'

import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { Button, Select, Textarea, Typography } from '@/shared/ui'
import { Modal } from '@/shared/ui'
import type { AIFeedbackCategory } from '@/modules/admin/ai-feedback'
import { FEEDBACK_CATEGORIES } from '@/modules/admin/ai-feedback'
import { useAIRunFeedbackControls } from '../hooks/useAIRunFeedbackControls'

interface AIRunFeedbackControlsProps {
  orgId: string
  runId: string
  compact?: boolean
}

export function AIRunFeedbackControls({
  orgId,
  runId,
  compact = false,
}: AIRunFeedbackControlsProps) {
  const feedback = useAIRunFeedbackControls({ orgId, runId })

  if (feedback.submitted) {
    return (
      <Typography variant="xs" tone="muted">
        Feedback submitted. Thank you.
      </Typography>
    )
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'space-y-2'}>
      {!compact ? (
        <Typography variant="small" tone="muted">
          Was this AI output helpful?
        </Typography>
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={feedback.submitting}
          onClick={() => void feedback.submitRating('positive')}
          aria-label="Helpful"
        >
          <ThumbsUp size={16} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={feedback.submitting}
          onClick={() => void feedback.submitRating('negative', true)}
          aria-label="Not helpful"
        >
          <ThumbsDown size={16} />
        </Button>
      </div>

      <Modal
        open={feedback.dialogOpen}
        onClose={() => feedback.setDialogOpen(false)}
        title="What went wrong?"
        actions={[
          { label: 'Cancel', onClick: () => feedback.setDialogOpen(false), variant: 'ghost' },
          {
            label: 'Submit feedback',
            onClick: () =>
              feedback.pendingRating && void feedback.submitRating(feedback.pendingRating),
            variant: 'primary',
            disabled: feedback.submitting || (!feedback.category && !feedback.comment.trim()),
          },
        ]}
      >
        <div className="space-y-3">
          <Select
            options={[{ value: '', label: 'Select issue (optional)' }, ...FEEDBACK_CATEGORIES]}
            value={feedback.category}
            onValueChange={(value: string) => feedback.setCategory(value as AIFeedbackCategory | '')}
            className="w-full"
            size="sm"
          />
          <Textarea
            placeholder="Optional short comment"
            value={feedback.comment}
            onChange={(event) => feedback.setComment(event.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
