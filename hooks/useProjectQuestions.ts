'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectService from '@/services/project.service'
import type { ProjectQuestion, ProjectQuestionsResponse } from '@/services/project.service'

export function useProjectQuestions(orgId: string | null, projectId: string | null) {
  const [questionsMap, setQuestionsMap] = useState<ProjectQuestionsResponse>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await projectService.getProjectQuestions(orgId, projectId)
      setQuestionsMap(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId])

  useEffect(() => { load() }, [load])

  const activeQuestions: ProjectQuestion[] = Object.values(questionsMap)
    .flat()
    .filter((q) => q.status === 'active')

  return { questionsMap, activeQuestions, loading, error, refetch: load }
}
