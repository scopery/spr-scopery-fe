'use client'

import { Typography } from '@/shared/ui'
import type { ProjectQuestion } from '@/modules/projects'
import type { ClarityAssessment } from '@/modules/sessions/clarity'
import type { AnswerItem } from '../model/session'
import { SessionQuestionItem } from './SessionQuestionItem'

export type SessionDetailQuestionsProps = {
  orgId: string
  projectId: string
  sessionId: string
  orderedSectionEntries: [string, ProjectQuestion[]][]
  questionOrderMap: Record<string, number>
  answers: Record<string, AnswerItem>
  assessmentsByOrder: Record<number, ClarityAssessment>
  loadingByOrder: Record<number, boolean>
  readonly: boolean
  canSave: boolean
  canAssessClarity: boolean
  featureDisabled: boolean
  linkPerms: {
    canView: boolean
    canCreate: boolean
    canRemove: boolean
    canRestoreDocument: boolean
    canExport: boolean
    canCreateDeliverable: boolean
  }
  onAnswerChange: (
    questionId: string,
    status: 'answered' | 'skipped' | 'na',
    value: unknown,
    skipReason?: string
  ) => void
  onAiImprove: (question: ProjectQuestion) => void
  onAssessClarity: (order: number, q: ProjectQuestion, answer: AnswerItem | undefined) => void
  onOpenClarityModal: (order: number) => void
}

export function SessionDetailQuestions({
  orgId,
  projectId,
  sessionId,
  orderedSectionEntries,
  questionOrderMap,
  answers,
  assessmentsByOrder,
  loadingByOrder,
  readonly,
  canSave,
  canAssessClarity,
  featureDisabled,
  linkPerms,
  onAnswerChange,
  onAiImprove,
  onAssessClarity,
  onOpenClarityModal,
}: SessionDetailQuestionsProps) {
  return (
    <div className="space-y-8">
      {orderedSectionEntries.map(([section, questions]) => (
        <div key={section} id={`section-${section}`} className="scroll-mt-24">
          <Typography
            as="h2"
            size="lg"
            weight="semibold"
            className="mb-4 capitalize text-neutral-400"
          >
            {section}
          </Typography>
          <div className="space-y-4">
            {questions.map((q) => {
              const order = questionOrderMap[q.id]
              return (
                <div key={q.id} id={order != null ? `question-order-${order}` : undefined}>
                  <SessionQuestionItem
                    q={q}
                    answer={answers[q.id]}
                    onChange={(status, value, skipReason) =>
                      onAnswerChange(q.id, status, value, skipReason)
                    }
                    readonly={readonly}
                    showAiButton={canSave}
                    onAiImprove={canSave ? onAiImprove : undefined}
                    questionOrder={order}
                    clarityAssessment={order != null ? assessmentsByOrder[order] : undefined}
                    onAssessClarity={
                      order != null && canAssessClarity
                        ? () => onAssessClarity(order, q, answers[q.id])
                        : undefined
                    }
                    assessClarityLoading={order != null ? loadingByOrder[order] : false}
                    onOpenClarityModal={
                      order != null && assessmentsByOrder[order]
                        ? () => onOpenClarityModal(order)
                        : undefined
                    }
                    showAssessClarityButton={canAssessClarity}
                    clarityFeatureDisabled={featureDisabled}
                    orgId={orgId}
                    projectId={projectId}
                    sessionId={sessionId}
                    linkPermissions={linkPerms}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
