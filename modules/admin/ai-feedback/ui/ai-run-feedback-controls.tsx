'use client'

import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { Button, Select, Textarea, Typography } from '@/shared/ui'
import { Modal } from '@/shared/ui'
import * as feedbackApi from '../api/ai-run-feedback.api'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { AIFeedbackCategory } from '@/modules/admin/ai-feedback'
import { FEEDBACK_CATEGORIES } from '@/modules/admin/ai-feedback'

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingRating, setPendingRating] = useState<'positive' | 'negative' | null>(null)
  const [category, setCategory] = useState<AIFeedbackCategory | ''>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submitRating = async (rating: 'positive' | 'negative', withDialog = false) => {
    if (rating === 'negative' && withDialog) {
      setPendingRating('negative')
      setDialogOpen(true)
      return
    }

    setSubmitting(true)
    try {
      await feedbackApi.submitRunFeedback(orgId, runId, {
        rating,
        feedback_category: category || null,
        feedback_text: comment.trim() || null,
      })
      setSubmitted(true)
      setDialogOpen(false)
      toast.success('Thanks — your feedback helps improve this AI agent.')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
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
          disabled={submitting}
          onClick={() => submitRating('positive')}
          aria-label="Helpful"
        >
          <ThumbsUp size={16} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={() => submitRating('negative', true)}
          aria-label="Not helpful"
        >
          <ThumbsDown size={16} />
        </Button>
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="What went wrong?"
        actions={[
          { label: 'Cancel', onClick: () => setDialogOpen(false), variant: 'ghost' },
          {
            label: 'Submit feedback',
            onClick: () => pendingRating && submitRating(pendingRating),
            variant: 'primary',
            disabled: submitting || (!category && !comment.trim()),
          },
        ]}
      >
        <div className="space-y-3">
          <Select
            options={[{ value: '', label: 'Select issue (optional)' }, ...FEEDBACK_CATEGORIES]}
            value={category}
            onValueChange={(value: string) => setCategory(value as AIFeedbackCategory | '')}
            className="w-full"
            size="sm"
          />
          <Textarea
            placeholder="Optional short comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
