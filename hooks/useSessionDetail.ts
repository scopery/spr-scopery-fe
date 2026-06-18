'use client'

import { useCallback, useEffect, useState } from 'react'
import * as sessionService from '@/services/session.service'
import type { AnswerItem, SessionDetail, SessionProgress } from '@/services/session.service'

export function useSessionDetail(
  orgId: string | null,
  projectId: string | null,
  sessionId: string | null,
) {
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [answers, setAnswers] = useState<Record<string, AnswerItem>>({})
  const [progress, setProgress] = useState<SessionProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    if (!orgId || !projectId || !sessionId) return
    setLoading(true)
    setError(null)
    try {
      const s = await sessionService.getSession(orgId, projectId, sessionId)
      setSession(s)
      const map: Record<string, AnswerItem> = {}
      s.answers.forEach((a) => { map[a.question_id] = a })
      setAnswers(map)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId, sessionId])

  const loadProgress = useCallback(async () => {
    if (!orgId || !projectId || !sessionId) return
    try {
      const p = await sessionService.getSessionProgress(orgId, projectId, sessionId)
      setProgress(p)
    } catch {
      setProgress(null)
    }
  }, [orgId, projectId, sessionId])

  useEffect(() => { void loadSession() }, [loadSession])

  useEffect(() => {
    if (session) void loadProgress()
  }, [session?.id, loadProgress])

  return {
    session,
    answers,
    setAnswers,
    progress,
    loading,
    error,
    refetch: loadSession,
    refetchProgress: loadProgress,
  }
}
