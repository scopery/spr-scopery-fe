'use client'

import { useState } from 'react'
import * as feedbackApi from '../api/ai-run-feedback.api'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { AIFeedbackCategory } from '@/modules/admin/ai-feedback'

interface UseAIRunFeedbackControlsParams {
  orgId: string
  runId: string
}

export function useAIRunFeedbackControls({ orgId, runId }: UseAIRunFeedbackControlsParams) {
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

  return {
    dialogOpen,
    pendingRating,
    category,
    comment,
    submitting,
    submitted,
    setDialogOpen,
    setCategory,
    setComment,
    submitRating,
  }
}
