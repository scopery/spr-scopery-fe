'use client'

import { useEffect, useState } from 'react'
import { Modal, Radio, Textarea, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { ElicitationQuestion } from '../../domain/model/elicitation'

const OTHER_VALUE = '__other__'

interface AnswerQuestionModalProps {
  question: ElicitationQuestion | null
  onClose: () => void
  onSubmit: (questionId: string, answerText: string) => Promise<void>
}

export function AnswerQuestionModal({ question, onClose, onSubmit }: AnswerQuestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)

  const hasSuggestions = (question?.suggestedAnswers?.length ?? 0) > 0

  useEffect(() => {
    if (!question) return
    setCustomText('')
    if (!hasSuggestions) {
      setSelectedOption(OTHER_VALUE)
    } else {
      const existing = question.answerText
      if (existing) {
        const matched = question.suggestedAnswers?.find((s) => s === existing)
        setSelectedOption(matched ?? OTHER_VALUE)
        if (!matched) setCustomText(existing)
      } else {
        setSelectedOption(null)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id])

  const effectiveAnswer =
    selectedOption === OTHER_VALUE ? customText.trim() : (selectedOption ?? '')

  const canSubmit = effectiveAnswer.length > 0

  const handleSubmit = async () => {
    if (!question || !canSubmit) return
    setLoading(true)
    try {
      await onSubmit(question.id, effectiveAnswer)
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
          disabled: !canSubmit,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="body" className="text-neutral-700">
          {question?.questionText}
        </Typography>

        {hasSuggestions && (
          <div className="flex flex-col gap-2">
            {question!.suggestedAnswers!.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedOption(option)}
                className={cn(
                  'flex items-start gap-3 border px-4 py-3 text-left transition-colors',
                  selectedOption === option
                    ? 'border-neutral-800 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                )}
              >
                <Radio
                  name={`answer-${question!.id}`}
                  value={option}
                  checked={selectedOption === option}
                  onChange={() => setSelectedOption(option)}
                  size="sm"
                  className="mt-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <Typography variant="body" as="span" className="text-neutral-800">
                  {option}
                </Typography>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedOption(OTHER_VALUE)}
              className={cn(
                'flex items-start gap-3 border px-4 py-3 text-left transition-colors',
                selectedOption === OTHER_VALUE
                  ? 'border-neutral-800 bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
              )}
            >
              <Radio
                name={`answer-${question!.id}`}
                value={OTHER_VALUE}
                checked={selectedOption === OTHER_VALUE}
                onChange={() => setSelectedOption(OTHER_VALUE)}
                size="sm"
                className="mt-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
              <Typography variant="body" as="span" className="text-neutral-500 italic">
                Other (type your own)
              </Typography>
            </button>
          </div>
        )}

        {selectedOption === OTHER_VALUE && (
          <Textarea
            label={hasSuggestions ? 'Your custom answer' : 'Your answer'}
            required
            fullWidth
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={4}
            placeholder="Provide a clear, detailed answer…"
            autoFocus
          />
        )}
      </div>
    </Modal>
  )
}
