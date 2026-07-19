'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Textarea, Typography } from '@/shared/ui'

export type FeedbackRating = 'THUMBS_UP' | 'THUMBS_DOWN'

export interface FeedbackFormValues {
  rating: FeedbackRating
  reasonCode: string | null
  comment: string
}

interface MessageFeedbackDialogProps {
  open: boolean
  onClose: () => void
  initialRating: FeedbackRating
  loading?: boolean
  onSubmit: (values: FeedbackFormValues) => Promise<boolean>
}

const REASON_OPTIONS = [
  { value: '', label: 'No specific reason' },
  { value: 'INACCURATE', label: 'Inaccurate' },
  { value: 'INCOMPLETE', label: 'Incomplete' },
  { value: 'UNHELPFUL', label: 'Not helpful' },
  { value: 'OFF_TOPIC', label: 'Off topic' },
  { value: 'HARMFUL', label: 'Harmful / unsafe' },
  { value: 'OTHER', label: 'Other' },
]

export function MessageFeedbackDialog({
  open,
  onClose,
  initialRating,
  loading = false,
  onSubmit,
}: MessageFeedbackDialogProps) {
  const [rating, setRating] = useState<FeedbackRating>(initialRating)
  const [reasonCode, setReasonCode] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) {
      setRating(initialRating)
      setReasonCode('')
      setComment('')
    }
  }, [open, initialRating])

  const handleSubmit = async () => {
    const ok = await onSubmit({
      rating,
      reasonCode: reasonCode || null,
      comment: comment.trim().slice(0, 2000),
    })
    if (ok) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Message feedback"
      size="sm"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost', disabled: loading },
        {
          label: 'Submit',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: loading,
        },
      ]}
    >
      <Stack direction="vertical" spacing="md">
        <Typography variant="small" tone="muted">
          Feedback is create-once for this message. You cannot edit it after submit.
        </Typography>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Rating
          </Typography>
          <Select
            value={rating}
            onValueChange={(v: string) => setRating(v as FeedbackRating)}
            options={[
              { value: 'THUMBS_UP', label: 'Helpful' },
              { value: 'THUMBS_DOWN', label: 'Not helpful' },
            ]}
          />
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Reason (optional)
          </Typography>
          <Select
            value={reasonCode}
            onValueChange={setReasonCode}
            options={REASON_OPTIONS}
          />
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Comment (optional)
          </Typography>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 2000))}
            rows={3}
            maxLength={2000}
            placeholder="What could be better?"
          />
          <Typography variant="caption" tone="muted" className="mt-1 block">
            {comment.length}/2000
          </Typography>
        </div>
      </Stack>
    </Modal>
  )
}

/** @deprecated Input kept for accidental imports — use Textarea above */
void Input
