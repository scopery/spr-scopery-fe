'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../../infrastructure/api/elicitation.api'
import type {
  ElicitationQuestion,
  ElicitationRound,
  ElicitationSession,
  ElicitationSuggestion,
  StartElicitationSessionPayload,
  SubmitRoundResponse,
} from '../../domain/model/elicitation'
import { RoundStatus } from '../../domain/enums/elicitation.enum'

export function useElicitationSession(projectId: string | null) {
  const [sessions, setSessions] = useState<ElicitationSession[]>([])
  const [activeSession, setActiveSession] = useState<ElicitationSession | null>(null)
  const [questions, setQuestions] = useState<ElicitationQuestion[]>([])
  const [rounds, setRounds] = useState<ElicitationRound[]>([])
  const [suggestion, setSuggestion] = useState<ElicitationSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateAbortRef = useRef<AbortController | null>(null)

  const activeRound = rounds.find((r) => r.status === RoundStatus.Active) ?? null
  const lastEvaluatedRound =
    [...rounds].reverse().find((r) => r.status === RoundStatus.Evaluated) ?? null
  const shouldContinue = lastEvaluatedRound?.shouldContinue ?? null

  const loadSessions = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listSessions(projectId)
      setSessions(res)
      const active = res.find((s) => s.status === 'ACTIVE') ?? null
      setActiveSession(active)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const loadQuestions = useCallback(
    async (sessionId: string) => {
      if (!projectId) return
      try {
        const res = await api.listQuestions(projectId, sessionId)
        setQuestions(res)
      } catch {
        setQuestions([])
      }
    },
    [projectId]
  )

  const loadRounds = useCallback(
    async (sessionId: string) => {
      if (!projectId) return
      try {
        const res = await api.listRounds(projectId, sessionId)
        setRounds(res)
      } catch {
        setRounds([])
      }
    },
    [projectId]
  )

  const loadSuggestion = useCallback(async (roundId: string) => {
    try {
      const res = await api.getSuggestions(roundId)
      setSuggestion(res)
    } catch {
      setSuggestion(null)
    }
  }, [])

  useEffect(() => {
    if (activeSession) {
      void loadQuestions(activeSession.id)
      void loadRounds(activeSession.id)
    } else {
      setQuestions([])
      setRounds([])
      setSuggestion(null)
    }
  }, [activeSession, loadQuestions, loadRounds])

  const startSession = useCallback(
    async (body: StartElicitationSessionPayload) => {
      if (!projectId) return null
      const session = await api.startSession(projectId, body)
      await loadSessions()
      return session
    },
    [projectId, loadSessions]
  )

  const generateNextRound = useCallback(async () => {
    if (!projectId || !activeSession) return

    generateAbortRef.current?.abort()
    const controller = new AbortController()
    generateAbortRef.current = controller

    setIsGenerating(true)
    return new Promise<void>((resolve, reject) => {
      api.streamGenerateRound(
        projectId,
        activeSession.id,
        (q) => {
          setQuestions((prev) =>
            prev.some((existing) => existing.id === q.id) ? prev : [...prev, q]
          )
        },
        (r) => {
          setRounds((prev) =>
            prev.some((existing) => existing.id === r.id) ? prev : [...prev, r]
          )
          setIsGenerating(false)
          resolve()
        },
        (err) => {
          setIsGenerating(false)
          reject(err)
        },
        controller.signal
      )
    })
  }, [projectId, activeSession])

  const answerQuestion = useCallback(
    async (questionId: string, answerText: string) => {
      if (!projectId || !activeSession) return
      const updated = await api.answerQuestion(projectId, activeSession.id, questionId, {
        answerText,
      })
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? updated : q)))
    },
    [projectId, activeSession]
  )

  const skipQuestion = useCallback(
    async (questionId: string) => {
      if (!projectId || !activeSession) return
      const updated = await api.skipQuestion(projectId, activeSession.id, questionId)
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? updated : q)))
    },
    [projectId, activeSession]
  )

  const submitRound = useCallback(
    async (roundId: string): Promise<SubmitRoundResponse> => {
      if (!projectId || !activeSession) throw new Error('No active session')
      setIsSubmitting(true)
      try {
        const result = await api.submitRound(projectId, activeSession.id, roundId)
        setRounds((prev) => prev.map((r) => (r.id === roundId ? result.round : r)))
        setQuestions((prev) =>
          prev.map((q) => {
            const evaluation = result.evaluations.find((e) => e.questionId === q.id)
            if (!evaluation) return q
            return {
              ...q,
              clarityLevel: evaluation.clarityLevel,
              aiFeedback: evaluation.feedback,
            }
          })
        )
        return result
      } finally {
        setIsSubmitting(false)
      }
    },
    [projectId, activeSession]
  )

  const closeSession = useCallback(async () => {
    if (!projectId || !activeSession) return null
    const session = await api.closeSession(projectId, activeSession.id)
    await loadSessions()
    return session
  }, [projectId, activeSession, loadSessions])

  const cancelSession = useCallback(async () => {
    if (!projectId || !activeSession) return
    await api.cancelSession(projectId, activeSession.id)
    await loadSessions()
  }, [projectId, activeSession, loadSessions])

  const generateSuggestions = useCallback(async (roundId: string) => {
    const result = await api.generateSuggestions(roundId)
    setSuggestion(result)
    return result
  }, [])

  const approveSuggestionItem = useCallback(
    async (itemId: string) => {
      await api.approveSuggestionItem(itemId)
      if (suggestion) {
        const latestRound = rounds[rounds.length - 1]
        if (latestRound) await loadSuggestion(latestRound.id)
      }
    },
    [suggestion, rounds, loadSuggestion]
  )

  const rejectSuggestionItem = useCallback(
    async (itemId: string) => {
      await api.rejectSuggestionItem(itemId)
      if (suggestion) {
        const latestRound = rounds[rounds.length - 1]
        if (latestRound) await loadSuggestion(latestRound.id)
      }
    },
    [suggestion, rounds, loadSuggestion]
  )

  const clearSuggestion = useCallback(() => setSuggestion(null), [])

  return {
    sessions,
    activeSession,
    questions,
    rounds,
    activeRound,
    shouldContinue,
    suggestion,
    loading,
    isGenerating,
    isSubmitting,
    error,
    refetch: loadSessions,
    loadQuestions,
    loadRounds,
    loadSuggestion,
    clearSuggestion,
    startSession,
    generateNextRound,
    answerQuestion,
    skipQuestion,
    submitRound,
    closeSession,
    cancelSession,
    generateSuggestions,
    approveSuggestionItem,
    rejectSuggestionItem,
  }
}
