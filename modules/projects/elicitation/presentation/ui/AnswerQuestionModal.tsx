'use client'

import { useEffect, useState } from 'react'
import { Modal, Textarea, Typography } from '@/shared/ui'
import type { ElicitationQuestion } from '../../domain/model/elicitation'

interface AnswerQuestionModalProps {
  question: ElicitationQuestion | null
  onClose: () => void
  onSubmit: (questionId: string, answerText: string) => Promise<void>
}

export function AnswerQuestionModal({ question, onClose, onSubmit }: AnswerQuestionModalProps) {
  const [answerText, setAnswerText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!question) return
    setAnswerText(question.answerText ?? '')
  }, [question])

  const handleSubmit = async () => {
    if (!question || !answerText.trim()) return
    setLoading(true)
    try {
      await onSubmit(question.id, answerText.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={!!question}
      onClose={onClose}
      title={`Q${question?.sequence ?? ''}: Answer`}
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Save answer',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !answerText.trim(),
        },
      ]}
    >
      <div className="space-y-3">
        <Typography variant="body" className="text-neutral-600">
          {question?.questionText}
        </Typography>
        <Textarea
          label="Your answer"
          required
          fullWidth
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          rows={5}
          placeholder="Provide a clear, detailed answer…"
        />
      </div>
    </Modal>
  )
}
