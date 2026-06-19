'use client'

import { useCallback, useEffect, useState } from 'react'
import * as questionsApi from '../api/questions.api'
import type { ProjectQuestion, ProjectQuestionsResponse } from '../model/questions'

export function useProjectQuestions(orgId: string | null, projectId: string | null) {
  const [questionsMap, setQuestionsMap] = useState<ProjectQuestionsResponse>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await questionsApi.getProjectQuestions(orgId, projectId)
      setQuestionsMap(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const activeQuestions: ProjectQuestion[] = Object.values(questionsMap)
    .flat()
    .filter((q) => q.status === 'active')

  return { questionsMap, activeQuestions, loading, error, refetch: load }
}
