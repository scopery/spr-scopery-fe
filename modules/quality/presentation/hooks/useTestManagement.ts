'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/quality.api'
import type {
  CreateTestCasePayload,
  CreateTestPlanPayload,
  CreateTestRunPayload,
  CreateTestSuitePayload,
  TestCase,
  TestPlan,
  TestRun,
  TestSuite,
} from '../../domain/model/quality'

export function useTestManagement(projectId: string | null) {
  const [plans, setPlans] = useState<TestPlan[]>([])
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [cases, setCases] = useState<TestCase[]>([])
  const [runs, setRuns] = useState<TestRun[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [p, c, r] = await Promise.all([
        api.listTestPlans(projectId),
        api.listTestCases(projectId),
        api.listTestRuns(projectId),
      ])
      setPlans(p.items)
      setCases(c.items)
      setRuns(r.items)
      setSelectedPlanId((prev) => {
        if (prev && p.items.some((x) => x.id === prev)) return prev
        return p.items[0]?.id ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test management')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const loadSuites = useCallback(async () => {
    if (!projectId || !selectedPlanId) {
      setSuites([])
      return
    }
    try {
      const res = await api.listTestSuites(projectId, selectedPlanId)
      setSuites(res.items)
    } catch {
      setSuites([])
    }
  }, [projectId, selectedPlanId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadSuites()
  }, [loadSuites])

  const createPlan = useCallback(
    async (body: CreateTestPlanPayload) => {
      if (!projectId) return
      await api.createTestPlan(projectId, body)
    },
    [projectId]
  )

  const createSuite = useCallback(
    async (body: CreateTestSuitePayload) => {
      if (!projectId || !selectedPlanId) {
        throw new Error('Select a test plan first')
      }
      await api.createTestSuite(projectId, selectedPlanId, body)
    },
    [projectId, selectedPlanId]
  )

  const createCase = useCallback(
    async (body: CreateTestCasePayload) => {
      if (!projectId) return
      const suiteId = body.testSuiteId ?? suites[0]?.id ?? null
      await api.createTestCase(projectId, {
        ...body,
        testSuiteId: suiteId,
      })
    },
    [projectId, suites]
  )

  const createRun = useCallback(
    async (body: CreateTestRunPayload) => {
      if (!projectId) return
      await api.createTestRun(projectId, {
        ...body,
        testPlanId: body.testPlanId ?? selectedPlanId,
      })
    },
    [projectId, selectedPlanId]
  )

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
    suites,
    cases,
    runs,
    selectedPlanId,
    setSelectedPlanId,
    loading,
    error,
    actionError,
    refetch: load,
    refetchSuites: loadSuites,
    createPlan,
    createSuite,
    createCase,
    createRun,
    approvePlan,
    startRun,
    completeRun,
    cancelRun,
  }
}
