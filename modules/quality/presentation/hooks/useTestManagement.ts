'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/quality.api'
import type { TestPlanItem, TestRunItem } from '../../infrastructure/api/quality.api'

export function useTestManagement(projectId: string | null) {
  const [plans, setPlans] = useState<TestPlanItem[]>([])
  const [runs, setRuns] = useState<TestRunItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [p, r] = await Promise.all([
        api.listTestPlans(projectId),
        api.listTestRuns(projectId),
      ])
      setPlans(p.items)
      setRuns(r.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test management')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const approvePlan = useCallback(
    async (planId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.approveTestPlan(projectId, planId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Approve test plan failed')
      }
    },
    [projectId, load]
  )

  const startRun = useCallback(
    async (runId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.startTestRun(projectId, runId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Start test run failed')
      }
    },
    [projectId, load]
  )

  const completeRun = useCallback(
    async (runId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.completeTestRun(projectId, runId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Complete test run failed')
      }
    },
    [projectId, load]
  )

  const cancelRun = useCallback(
    async (runId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.cancelTestRun(projectId, runId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Cancel test run failed')
      }
    },
    [projectId, load]
  )

  return {
    plans,
    runs,
    loading,
    error,
    actionError,
    refetch: load,
    approvePlan,
    startRun,
    completeRun,
    cancelRun,
  }
}
