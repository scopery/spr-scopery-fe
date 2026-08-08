'use client'

import { useState } from 'react'
import { Badge, Button, Spinner, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { ElicitationQuestion, ElicitationSession } from '../../domain/model/elicitation'
import { QuestionStatus } from '../../domain/enums/elicitation.enum'
import { ClarityBadge } from './ClarityBadge'
import { AnswerQuestionModal } from './AnswerQuestionModal'

interface QuestionsPanelProps {
  session: ElicitationSession
  questions: ElicitationQuestion[]
  generating: boolean
  evaluating: boolean
  onGenerate: () => Promise<void>
  onAnswer: (questionId: string, answerText: string) => Promise<void>
  onSkip: (questionId: string) => Promise<void>
  onEvaluate: () => Promise<void>
  onCloseSession: () => Promise<void>
}

export function QuestionsPanel({
  session,
  questions,
  generating,
  evaluating,
  onGenerate,
  onAnswer,
  onSkip,
  onEvaluate,
  onCloseSession,
}: QuestionsPanelProps) {
  const [answeringQuestion, setAnsweringQuestion] = useState<ElicitationQuestion | null>(null)
  const [closingSession, setClosingSession] = useState(false)
  const [skippingId, setSkippingId] = useState<string | null>(null)

  const pending = questions.filter((q) => q.status === QuestionStatus.Pending)
  const answered = questions.filter((q) => q.status === QuestionStatus.Answered)
  const hasAnsweredUnevaluated = answered.some((q) => !q.clarityLevel)
  const isActive = session.status === 'ACTIVE'

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

  const handleEvaluate = async () => {
    try {
      await onEvaluate()
      toast.success('Answers evaluated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleGenerate = async () => {
    try {
      await onGenerate()
      toast.success('Questions generated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleClose = async () => {
    setClosingSession(true)
    try {
      await onCloseSession()
      toast.success('Session closed — elicitation round created')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setClosingSession(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      {isActive && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="primary"
            onClick={() => void handleGenerate()}
            loading={generating}
            disabled={generating || evaluating}
          >
            Generate questions
          </Button>
          {hasAnsweredUnevaluated && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void handleEvaluate()}
              loading={evaluating}
              disabled={generating || evaluating}
            >
              Evaluate answers (AI)
            </Button>
          )}
          {questions.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              tone="error"
              onClick={() => void handleClose()}
              loading={closingSession}
              disabled={generating || evaluating || closingSession}
            >
              Close session & create round
            </Button>
          )}
        </div>
      )}

      {/* Stats */}
      {questions.length > 0 && (
        <div className="flex gap-3 text-sm text-neutral-500">
          <span>{questions.length} total</span>
          <span>·</span>
          <span>{answered.length} answered</span>
          <span>·</span>
          <span>{pending.length} pending</span>
        </div>
      )}

      {/* Questions list */}
      {questions.length === 0 && !generating && (
        <div className="py-12 text-center text-neutral-400">
          <Typography variant="body">
            No questions yet. Click &quot;Generate questions&quot; to start.
          </Typography>
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-2 py-4 text-neutral-500">
          <Spinner size="sm" />
          <Typography variant="body">Generating questions…</Typography>
        </div>
      )}

      <div className="flex flex-col divide-y divide-neutral-100">
        {questions.map((q) => (
          <div key={q.id} className="py-3 flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <span className="text-xs text-neutral-400 min-w-[2rem] pt-0.5">#{q.sequence}</span>
              <div className="flex-1 min-w-0">
                <Typography variant="body" className="font-medium text-neutral-800">
                  {q.questionText}
                </Typography>

                {q.aiFeedback && (
                  <Typography variant="caption" className="mt-1 text-amber-700 italic">
                    AI feedback: {q.aiFeedback}
                  </Typography>
                )}

                {q.answerText && (
                  <Typography variant="caption" className="mt-1 text-neutral-600">
                    ↳ {q.answerText}
                  </Typography>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <ClarityBadge clarityLevel={q.clarityLevel} />
                {q.status === QuestionStatus.Answered && !q.clarityLevel && (
                  <Badge tone="neutral" size="sm">Answered</Badge>
                )}
                {q.status === QuestionStatus.Skipped && (
                  <Badge tone="neutral" size="sm">Skipped</Badge>
                )}
              </div>
            </div>

            {isActive && q.status === QuestionStatus.Pending && (
              <div className="flex gap-2 ml-8">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAnsweringQuestion(q)}
                >
                  Answer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleSkip(q.id)}
                  loading={skippingId === q.id}
                  disabled={skippingId === q.id}
                >
                  Skip
                </Button>
              </div>
            )}

            {isActive && q.status === QuestionStatus.Answered && (
              <div className="flex gap-2 ml-8">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAnsweringQuestion(q)}
                >
                  Edit answer
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

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
