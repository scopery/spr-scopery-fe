'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as aiClarityApi from '../api/ai-clarity.api'
import type { ClarityAssessment, ClaritySummary } from '../model/clarity'
import type { ProjectQuestion } from '@/modules/projects'
import type { AnswerItem } from '@/modules/sessions/session/model/session'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { toAnswerText } from '@/utils/answerText'
import { FEATURES } from '@/config/features'

type UseSessionClarityParams = {
  orgId: string
  projectId: string
  sessionId: string
  sessionIdReady: boolean
  canAssessClarity: boolean
  orderedQuestions: ProjectQuestion[]
  questionOrderMap: Record<string, number>
  answers: Record<string, AnswerItem>
}

export function useSessionClarity({
  orgId,
  projectId,
  sessionId,
  sessionIdReady,
  canAssessClarity,
  orderedQuestions,
  questionOrderMap,
  answers,
}: UseSessionClarityParams) {
  const [claritySummary, setClaritySummary] = useState<ClaritySummary | null>(null)
  const [claritySummaryLoading, setClaritySummaryLoading] = useState(false)
  const [claritySummaryError, setClaritySummaryError] = useState(false)
  const [assessmentsByOrder, setAssessmentsByOrder] = useState<Record<number, ClarityAssessment>>(
    {}
  )
  const [loadingByOrder, setLoadingByOrder] = useState<Record<number, boolean>>({})
  const [featureDisabled, setFeatureDisabled] = useState(false)
  const [clarityModalOrder, setClarityModalOrder] = useState<number | null>(null)
  const [bulkAssessLoading, setBulkAssessLoading] = useState(false)
  const bulkAssessAbortRef = useRef(false)

  const loadClaritySummary = useCallback(() => {
    if (!FEATURES.aiClarityAssessment) return
    if (!orgId || !projectId || !sessionId) return
    setClaritySummaryLoading(true)
    setClaritySummaryError(false)
    aiClarityApi
      .getClaritySummary(orgId, projectId, sessionId)
      .then(setClaritySummary)
      .catch(() => setClaritySummaryError(true))
      .finally(() => setClaritySummaryLoading(false))
  }, [orgId, projectId, sessionId])

  useEffect(() => {
    if (sessionIdReady && FEATURES.aiClarityAssessment) loadClaritySummary()
  }, [sessionIdReady, loadClaritySummary])

  const handleAssessClarity = useCallback(
    async (order: number, q: ProjectQuestion, answer: AnswerItem | undefined) => {
      if (!orgId || !projectId || !sessionId || featureDisabled) return
      const answerText = toAnswerText(
        q.q_type,
        answer?.value,
        q.answer_schema as Record<string, unknown>
      )
      setLoadingByOrder((prev) => ({ ...prev, [order]: true }))
      try {
        const res = await aiClarityApi.assessOne(orgId, projectId, sessionId, {
          question_order: order,
          section: q.section || 'general',
          question_text: q.prompt,
          answer_text: answerText,
          q_type: q.q_type || null,
          required: !!q.required,
        })
        setAssessmentsByOrder((prev) => ({ ...prev, [res.question_order]: res.assessment }))
        loadClaritySummary()
      } catch (err) {
        const code = getProblemCode(err)
        if (err instanceof ApiError && err.status === 409 && code === 'AI_FEATURE_DISABLED') {
          setFeatureDisabled(true)
        }
        toast.error(getProblemToastMessage(err))
      } finally {
        setLoadingByOrder((prev) => ({ ...prev, [order]: false }))
      }
    },
    [orgId, projectId, sessionId, featureDisabled, loadClaritySummary]
  )

  const handleBulkAssess = useCallback(() => {
    if (!sessionIdReady || !orgId || !projectId || !sessionId || featureDisabled || !canAssessClarity)
      return

    const toAssess = orderedQuestions.filter((q) => {
      const order = questionOrderMap[q.id]
      if (!order || !q.required) return false
      const ans = answers[q.id]
      if (ans?.answer_status !== 'answered') return false
      if (assessmentsByOrder[order]) return false
      return true
    })

    if (toAssess.length === 0) {
      toast.info('No missing required answers to assess.')
      return
    }

    bulkAssessAbortRef.current = false
    setBulkAssessLoading(true)
    let done = 0

    const run = async () => {
      for (const q of toAssess) {
        if (bulkAssessAbortRef.current) break
        const order = questionOrderMap[q.id]!
        const ans = answers[q.id]
        try {
          const res = await aiClarityApi.assessOne(orgId, projectId, sessionId, {
            question_order: order,
            section: q.section || 'general',
            question_text: q.prompt,
            answer_text: toAnswerText(
              q.q_type,
              ans?.value,
              q.answer_schema as Record<string, unknown>
            ),
            q_type: q.q_type || null,
            required: !!q.required,
          })
          setAssessmentsByOrder((prev) => ({ ...prev, [res.question_order]: res.assessment }))
        } catch (err) {
          const code = getProblemCode(err)
          if (err instanceof ApiError && err.status === 409 && code === 'AI_FEATURE_DISABLED') {
            setFeatureDisabled(true)
            toast.error(getProblemToastMessage(err))
            break
          }
          toast.error(getProblemToastMessage(err))
        }
        done += 1
      }
      setBulkAssessLoading(false)
      if (done > 0) loadClaritySummary()
    }

    void run()
  }, [
    sessionIdReady,
    orgId,
    projectId,
    sessionId,
    featureDisabled,
    canAssessClarity,
    orderedQuestions,
    questionOrderMap,
    answers,
    assessmentsByOrder,
    loadClaritySummary,
  ])

  return {
    claritySummary,
    claritySummaryLoading,
    claritySummaryError,
    assessmentsByOrder,
    loadingByOrder,
    featureDisabled,
    clarityModalOrder,
    setClarityModalOrder,
    bulkAssessLoading,
    loadClaritySummary,
    handleAssessClarity,
    handleBulkAssess,
  }
}
