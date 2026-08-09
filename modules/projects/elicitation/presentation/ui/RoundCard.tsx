'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge, Button, Skeleton, Spinner, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { ElicitationQuestion, ElicitationRound } from '../../domain/model/elicitation'
import { ClarityLevel, QuestionStatus, RoundStatus } from '../../domain/enums/elicitation.enum'
import { ClarityBadge } from './ClarityBadge'
import { AnswerQuestionModal } from './AnswerQuestionModal'

interface RoundCardProps {
  round: ElicitationRound
  questions: ElicitationQuestion[]
  isStreaming?: boolean
  isSubmitting?: boolean
  onAnswer: (questionId: string, answerText: string) => Promise<void>
  onSkip: (questionId: string) => Promise<void>
  onSubmit: (roundId: string) => Promise<unknown>
}

function statusMeta(q: ElicitationQuestion): { label: string; alert?: boolean } {
  if (q.clarityLevel === ClarityLevel.Blocked) {
    return { label: 'Needs clarification', alert: true }
  }
  if (q.clarityLevel === ClarityLevel.Critical) {
    return { label: 'Needs clarification', alert: true }
  }
  if (q.status === QuestionStatus.Skipped) return { label: 'Skipped' }
  if (q.status === QuestionStatus.Answered) return { label: 'Answered' }
  return { label: 'Pending' }
}

export function RoundCard({
  round,
  questions,
  isStreaming = false,
  isSubmitting = false,
  onAnswer,
  onSkip,
  onSubmit,
}: RoundCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [answeringQuestion, setAnsweringQuestion] = useState<ElicitationQuestion | null>(null)
  const [skippingId, setSkippingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isActive = round.status === RoundStatus.Active
  const hasAnswered = questions.some((q) => q.status === QuestionStatus.Answered)
  const resolved = questions.filter(
    (q) => q.status === QuestionStatus.Answered || q.status === QuestionStatus.Skipped
  ).length
  const needsClarification = questions.filter(
    (q) =>
      q.clarityLevel === ClarityLevel.Blocked ||
      q.clarityLevel === ClarityLevel.Critical ||
      (isActive && q.status === QuestionStatus.Pending)
  ).length
  const isRoundBlocked = questions.some(
    (q) =>
      q.clarityLevel === ClarityLevel.Blocked ||
      round.overallClarity === ClarityLevel.Blocked ||
      round.overallClarity === ClarityLevel.Critical
  )

  const statusText =
    round.status === RoundStatus.Evaluated
      ? 'Evaluated'
      : round.status === RoundStatus.Active
        ? 'In progress'
        : round.status

  const handleSkip = async (id: string) => {
    setSkippingId(id)
    try {
      await onSkip(id)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSkippingId(null)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit(round.id)
      toast.success('Round submitted and evaluated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overflow-hidden border border-neutral-200">
      <div
        className="flex cursor-pointer select-none items-start justify-between gap-3 px-4 py-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Typography variant="body" className="text-base font-semibold text-neutral-900">
              Round {round.roundNumber}
            </Typography>
            <Typography variant="caption" className="text-neutral-500">
              {statusText} · {questions.length} question{questions.length === 1 ? '' : 's'}
            </Typography>
          </div>
          {questions.length > 0 ? (
            <Typography variant="caption" className="mt-1 block text-neutral-500">
              {resolved} resolved
              {needsClarification > 0
                ? ` · ${needsClarification} need${needsClarification === 1 ? 's' : ''} clarification`
                : ''}
            </Typography>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isRoundBlocked ? (
            <Badge variant="solid" tone="error" size="sm">
              Blocked
            </Badge>
          ) : null}
          {isActive && hasAnswered && (
            <Button
              size="sm"
              variant="primary"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                void handleSubmit()
              }}
              loading={submitting || isSubmitting}
              disabled={submitting || isSubmitting || isStreaming}
            >
              Submit & Evaluate
            </Button>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-neutral-400" />
          ) : (
            <ChevronDown size={16} className="text-neutral-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-100">
          {questions.map((q) => {
            const meta = statusMeta(q)
            return (
              <div
                key={q.id}
                className="flex min-h-16 flex-col gap-2 border-b border-neutral-100 px-4 py-4 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <span className="w-5 shrink-0 pt-0.5 text-xs tabular-nums text-neutral-400">
                    {q.sequence}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Typography variant="body" className="text-sm font-medium text-neutral-900">
                      {q.questionText}
                    </Typography>
                    {q.answerText ? (
                      <Typography variant="caption" className="mt-1.5 block text-neutral-600">
                        {q.answerText}
                      </Typography>
                    ) : null}
                    {q.aiFeedback ? (
                      <Typography variant="caption" className="mt-1 block italic text-neutral-500">
                        {q.aiFeedback}
                      </Typography>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Clarity badges only on answered questions */}
                      {q.status === QuestionStatus.Answered ? (
                        <ClarityBadge clarityLevel={q.clarityLevel} />
                      ) : null}
                      <span
                        className={
                          meta.alert
                            ? 'text-xs font-medium text-error'
                            : 'text-xs text-neutral-500'
                        }
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </div>

                {isActive && q.status === QuestionStatus.Pending && (
                  <div className="ml-8 flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => setAnsweringQuestion(q)}>
                      Answer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleSkip(q.id)}
                      loading={skippingId === q.id}
                      disabled={!!skippingId}
                    >
                      Skip
                    </Button>
                  </div>
                )}

                {isActive && q.status === QuestionStatus.Answered && (
                  <div className="ml-8">
                    <Button size="sm" variant="ghost" onClick={() => setAnsweringQuestion(q)}>
                      Edit answer
                    </Button>
                  </div>
                )}
              </div>
            )
          })}

          {isStreaming && (
            <div className="flex flex-col gap-1.5 px-4 py-4">
              <div className="flex items-start gap-3">
                <Skeleton variant="text" width={16} height={14} className="mt-0.5 shrink-0" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton variant="text" width="70%" height={16} />
                  <Skeleton variant="text" width="45%" height={13} />
                </div>
              </div>
            </div>
          )}

          {questions.length === 0 && !isStreaming && (
            <div className="flex items-center gap-2 px-4 py-4 text-neutral-400">
              <Spinner size="sm" />
              <Typography variant="body">Loading questions…</Typography>
            </div>
          )}
        </div>
      )}

      <AnswerQuestionModal
        question={answeringQuestion}
        onClose={() => setAnsweringQuestion(null)}
        onSubmit={async (questionId, answerText) => {
          await onAnswer(questionId, answerText)
        }}
      />
    </div>
  )
}
