'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/elicitation.api'
import type {
  ElicitationQuestion,
  ElicitationRound,
  ElicitationSession,
  ElicitationSuggestion,
  StartElicitationSessionPayload,
} from '../../domain/model/elicitation'

export function useElicitationSession(projectId: string | null) {
  const [sessions, setSessions] = useState<ElicitationSession[]>([])
  const [activeSession, setActiveSession] = useState<ElicitationSession | null>(null)
  const [questions, setQuestions] = useState<ElicitationQuestion[]>([])
  const [rounds, setRounds] = useState<ElicitationRound[]>([])
  const [suggestion, setSuggestion] = useState<ElicitationSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const generateQuestions = useCallback(async () => {
    if (!projectId || !activeSession) return
    setGenerating(true)
    try {
      const res = await api.generateQuestions(projectId, activeSession.id)
      setQuestions((prev) => {
        const existingIds = new Set(prev.map((q) => q.id))
        return [...prev, ...res.filter((q) => !existingIds.has(q.id))]
      })
    } finally {
      setGenerating(false)
    }
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

  const evaluateAnswers = useCallback(async () => {
    if (!projectId || !activeSession) return
    setEvaluating(true)
    try {
      const updated = await api.evaluateAnswers(projectId, activeSession.id)
      setQuestions((prev) =>
        prev.map((q) => {
          const found = updated.find((u) => u.id === q.id)
          return found ?? q
        })
      )
    } finally {
      setEvaluating(false)
    }
  }, [projectId, activeSession])

  const closeSession = useCallback(async () => {
    if (!projectId || !activeSession) return null
    const round = await api.closeSession(projectId, activeSession.id)
    await loadSessions()
    return round
  }, [projectId, activeSession, loadSessions])

  const cancelSession = useCallback(async () => {
    if (!projectId || !activeSession) return
    await api.cancelSession(projectId, activeSession.id)
    await loadSessions()
  }, [projectId, activeSession, loadSessions])

  const submitRound = useCallback(
    async (roundId: string) => {
      const round = await api.submitRound(roundId)
      setRounds((prev) => prev.map((r) => (r.id === roundId ? round : r)))
      return round
    },
    []
  )

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

  return {
    sessions,
    activeSession,
    questions,
    rounds,
    suggestion,
    loading,
    generating,
    evaluating,
    error,
    refetch: loadSessions,
    loadQuestions,
    loadRounds,
    loadSuggestion,
    startSession,
    generateQuestions,
    answerQuestion,
    skipQuestion,
    evaluateAnswers,
    closeSession,
    cancelSession,
    submitRound,
    generateSuggestions,
    approveSuggestionItem,
    rejectSuggestionItem,
  }
}
