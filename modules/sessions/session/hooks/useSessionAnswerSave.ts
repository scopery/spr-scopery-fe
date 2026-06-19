'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as sessionsApi from '../api/sessions.api'
import type { AnswerItem, SessionDetail } from '../model/session'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import { answerValuesEqual, type AnswerStatus } from '../lib/session-answer-utils'

type UseSessionAnswerSaveParams = {
  orgId: string
  projectId: string
  sessionId: string
  session: SessionDetail | null
  canSaveBase: boolean
  canLock: boolean
  canReopen: boolean
  answers: Record<string, AnswerItem>
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, AnswerItem>>>
  refetchSession: () => void | Promise<void>
  refetchProgress: () => void | Promise<void>
}

export function useSessionAnswerSave({
  orgId,
  projectId,
  sessionId,
  session,
  canSaveBase,
  canLock,
  canReopen,
  answers,
  setAnswers,
  refetchSession,
  refetchProgress,
}: UseSessionAnswerSaveParams) {
  const [saving, setSaving] = useState(false)
  const [lockLoading, setLockLoading] = useState(false)
  const [reopenLoading, setReopenLoading] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const [lastSaveSuccess, setLastSaveSuccess] = useState(false)
  const [sessionLockedFrom409, setSessionLockedFrom409] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveIdRef = useRef(0)
  const answersRef = useRef(answers)
  answersRef.current = answers

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const canSave = canSaveBase && !sessionLockedFrom409

  const serializeValueForApi = useCallback(
    (a: {
      question_id: string
      answer_status: AnswerStatus
      value: unknown
      skip_reason?: string | null
    }): unknown => {
      const question = session?.questions?.find((q) => q.id === a.question_id)
      if (question && (question.q_type === 'text' || question.q_type === 'textarea')) {
        if (typeof a.value === 'string') return a.value
        if (a.value !== null && typeof a.value === 'object' && 'text' in a.value)
          return (a.value as { text?: string }).text ?? ''
        return ''
      }
      return a.value
    },
    [session?.questions]
  )

  const saveAnswers = useCallback(
    async (
      newAnswers: Array<{
        question_id: string
        answer_status: AnswerStatus
        value: unknown
        skip_reason?: string | null
      }>
    ) => {
      if (!canSave || newAnswers.length === 0) return
      saveIdRef.current += 1
      const thisSaveId = saveIdRef.current
      setSaving(true)
      try {
        const res = await sessionsApi.putAnswers(orgId, projectId, sessionId, {
          answers: newAnswers.map((a) => ({
            question_id: a.question_id,
            answer_status: a.answer_status,
            value: serializeValueForApi(a),
            skip_reason: a.skip_reason ?? null,
          })),
        })
        if (thisSaveId !== saveIdRef.current) return
        setAnswers((prev) => {
          const next = { ...prev }
          res.answers.forEach((a) => {
            const existing = prev[a.question_id]
            if (!existing) {
              next[a.question_id] = a
              return
            }
            if (answerValuesEqual(existing.value, a.value)) {
              next[a.question_id] = a
            } else {
              next[a.question_id] = { ...a, value: existing.value }
            }
          })
          return next
        })
        setLastSaveSuccess(true)
        void refetchProgress()
      } catch (err) {
        if (thisSaveId !== saveIdRef.current) return
        if (
          err instanceof ApiError &&
          (getProblemCode(err) === 'SESSION_LOCKED' || err.problem.type?.includes('session-locked'))
        ) {
          setSessionLockedFrom409(true)
          toast.error('Session locked')
          void refetchSession()
        } else {
          toast.error('Failed to save')
        }
        setLastSaveSuccess(false)
      } finally {
        if (thisSaveId === saveIdRef.current) {
          setSaving(false)
          setPendingSave(false)
        }
      }
    },
    [
      orgId,
      projectId,
      sessionId,
      canSave,
      serializeValueForApi,
      setAnswers,
      refetchSession,
      refetchProgress,
    ]
  )

  const cancelPendingAutosave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setPendingSave(false)
  }, [])

  const handleAnswerChange = useCallback(
    (questionId: string, status: AnswerStatus, value: unknown, skipReason?: string) => {
      const newAnswer = {
        question_id: questionId,
        answer_status: status,
        value,
        skip_reason: status === 'skipped' || status === 'na' ? (skipReason ?? null) : null,
      }
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          ...newAnswer,
          answered_by: '',
          answered_at: new Date().toISOString(),
        } as AnswerItem,
      }))
      setPendingSave(true)
      setLastSaveSuccess(false)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const current = answersRef.current[questionId]
        const toSave = current
          ? {
              question_id: current.question_id,
              answer_status: current.answer_status as AnswerStatus,
              value: current.value,
              skip_reason: current.skip_reason ?? null,
            }
          : newAnswer
        void saveAnswers([toSave])
        saveTimerRef.current = null
        setPendingSave(false)
      }, 3000)
    },
    [saveAnswers, setAnswers]
  )

  const handleSave = useCallback(() => {
    cancelPendingAutosave()
    const toSave = Object.values(answersRef.current).map((a) => ({
      question_id: a.question_id,
      answer_status: a.answer_status as AnswerStatus,
      value: a.value,
      skip_reason: a.skip_reason ?? null,
    }))
    if (toSave.length > 0) void saveAnswers(toSave)
    else toast.info('No answers to save')
  }, [cancelPendingAutosave, saveAnswers])

  const handleLock = useCallback(async () => {
    if (!canLock) return
    cancelPendingAutosave()
    setLockLoading(true)
    try {
      await sessionsApi.lockSession(orgId, projectId, sessionId)
      toast.success('Session locked')
      setSessionLockedFrom409(false)
      void refetchSession()
      void refetchProgress()
    } catch {
      toast.error('Failed to lock session')
    } finally {
      setLockLoading(false)
    }
  }, [canLock, cancelPendingAutosave, orgId, projectId, sessionId, refetchSession, refetchProgress])

  const handleReopen = useCallback(async () => {
    if (!canReopen) return
    cancelPendingAutosave()
    setSessionLockedFrom409(false)
    setReopenLoading(true)
    try {
      await sessionsApi.reopenSession(orgId, projectId, sessionId)
      toast.success('Session reopened')
      void refetchSession()
      void refetchProgress()
    } catch {
      toast.error('Failed to reopen session')
    } finally {
      setReopenLoading(false)
    }
  }, [
    canReopen,
    cancelPendingAutosave,
    orgId,
    projectId,
    sessionId,
    refetchSession,
    refetchProgress,
  ])

  return {
    saving,
    lockLoading,
    reopenLoading,
    pendingSave,
    lastSaveSuccess,
    sessionLockedFrom409,
    canSave,
    handleAnswerChange,
    handleSave,
    handleLock,
    handleReopen,
    cancelPendingAutosave,
    markSessionLocked: () => setSessionLockedFrom409(true),
  }
}
