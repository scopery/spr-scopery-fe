'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@/utils/useDebounce'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type {
  RunMembershipItem,
  TestRun,
  TestRunResult,
  TestRunResultsQuery,
  UpdateVerificationResultPayload,
  VerificationCaseResult,
} from '../../domain/model/quality'

export function useTestRuns(projectId: string | null) {
  const [runs, setRuns] = useState<TestRun[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [results, setResults] = useState<TestRunResult[]>([])
  const [verificationResults, setVerificationResults] = useState<VerificationCaseResult[]>([])
  const [membership, setMembership] = useState<RunMembershipItem[]>([])
  const [resultTotal, setResultTotal] = useState(0)
  const [loadingRuns, setLoadingRuns] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [hasDefect, setHasDefect] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? null,
    [runs, selectedRunId]
  )
  const runScope = String(selectedRun?.runScope ?? 'FUNCTIONAL').toUpperCase()
  const showsFunctionalResults = runScope === 'FUNCTIONAL' || runScope === 'MIXED'
  const showsVerificationResults = runScope === 'NON_FUNCTIONAL' || runScope === 'MIXED'

  const loadRuns = useCallback(async () => {
    if (!projectId) return
    setLoadingRuns(true)
    setError(null)
    try {
      const response = await qualityApi.listTestRuns(projectId, { page: 0, size: 50, sort: 'createdAt,asc' })
      setRuns(response.items)
      setSelectedRunId((current) =>
        current && response.items.some((run) => run.id === current)
          ? current
          : (response.items[0]?.id ?? null)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Test Runs')
    } finally {
      setLoadingRuns(false)
    }
  }, [projectId])

  const loadResults = useCallback(async () => {
    if (!projectId || !selectedRunId) {
      setResults([])
      setVerificationResults([])
      setResultTotal(0)
      return
    }
    setLoadingResults(true)
    try {
      const params: TestRunResultsQuery = {
        q: debouncedQuery || undefined,
        result: resultFilter || undefined,
        assigneeId: assigneeId || undefined,
        hasDefect: hasDefect === '' ? undefined : hasDefect === 'true',
        page: 0,
        size: 200,
      }
      const [functionalResponse, verificationResponse] = await Promise.all([
        showsFunctionalResults
          ? qualityApi.listTestRunResults(projectId, selectedRunId, params)
          : Promise.resolve({ items: [], page: { limit: 0, offset: 0, total: 0 } }),
        showsVerificationResults
          ? qualityApi.listVerificationResults(projectId, selectedRunId)
          : Promise.resolve({ items: [] }),
      ])
      const mapped = functionalResponse.items.map((item) => ({
        ...item,
        testCaseId: item.testCaseId ?? item.testCase?.id,
      }))
      mapped.sort((a, b) => {
        const ca = a.testCase?.code ?? ''
        const cb = b.testCase?.code ?? ''
        return ca.localeCompare(cb, undefined, { numeric: true, sensitivity: 'base' })
      })
      setResults(mapped)
      setVerificationResults(verificationResponse.items)
      setResultTotal(
        (functionalResponse.page?.total ?? functionalResponse.items.length) +
          verificationResponse.items.length
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Test Run results')
    } finally {
      setLoadingResults(false)
    }
  }, [
    assigneeId,
    debouncedQuery,
    hasDefect,
    projectId,
    resultFilter,
    selectedRunId,
    showsFunctionalResults,
    showsVerificationResults,
  ])

  const loadMembership = useCallback(async () => {
    if (!projectId || !selectedRunId) {
      setMembership([])
      return
    }
    try {
      const response = await qualityApi.getRunMembership(projectId, selectedRunId)
      setMembership(response?.items ?? [])
    } catch {
      setMembership([])
    }
  }, [projectId, selectedRunId])

  useEffect(() => {
    void loadRuns()
  }, [loadRuns])

  useEffect(() => {
    void loadResults()
  }, [loadResults])

  useEffect(() => {
    void loadMembership()
  }, [loadMembership])

  const updateResult = useCallback(
    async (resultId: string, changes: { result?: string; comment?: string | null }) => {
      if (!projectId || !selectedRunId) return
      const current = results.find((item) => item.id === resultId)
      if (!current) return
      setResults((items) =>
        items.map((item) =>
          item.id === resultId
            ? {
                ...item,
                resultStatus: changes.result ?? item.resultStatus,
                comment: changes.comment === undefined ? item.comment : changes.comment,
              }
            : item
        )
      )
      try {
        const updated = await qualityApi.updateTestRunResult(projectId, selectedRunId, resultId, {
          result: changes.result ?? current.resultStatus,
          comment: changes.comment === undefined ? current.comment : changes.comment,
          version: current.version,
        })
        // PATCH often omits nested testCase — keep list enrichment from prior state.
        setResults((items) =>
          items.map((item) =>
            item.id === resultId
              ? {
                  ...updated,
                  testCase: updated.testCase ?? current.testCase ?? item.testCase,
                  testCaseId:
                    updated.testCaseId ||
                    updated.testCase?.id ||
                    current.testCaseId ||
                    current.testCase?.id ||
                    item.testCaseId ||
                    item.testCase?.id,
                }
              : item
          )
        )
      } catch (err) {
        setResults((items) => items.map((item) => (item.id === resultId ? current : item)))
        throw err
      }
    },
    [projectId, results, selectedRunId]
  )

  const batchUpdateResults = useCallback(
    async (resultIds: string[], changes: { result?: string; assigneeId?: string | null }) => {
      if (!projectId || !selectedRunId || resultIds.length === 0) return
      await qualityApi.batchUpdateTestRunResults(projectId, selectedRunId, resultIds, changes)
      await Promise.all([loadResults(), loadRuns()])
    },
    [loadResults, loadRuns, projectId, selectedRunId]
  )

  const updateVerificationResult = useCallback(
    async (resultId: string, changes: Omit<UpdateVerificationResultPayload, 'version'>) => {
      if (!projectId || !selectedRunId) return
      const current = verificationResults.find((item) => item.id === resultId)
      if (!current) return
      setVerificationResults((items) =>
        items.map((item) =>
          item.id === resultId
            ? {
                ...item,
                ...changes,
                resultStatus: changes.resultStatus ?? item.resultStatus,
              }
            : item
        )
      )
      try {
        const updated = await qualityApi.updateVerificationResult(
          projectId,
          selectedRunId,
          resultId,
          {
            ...changes,
            version: current.version,
          }
        )
        setVerificationResults((items) =>
          items.map((item) => (item.id === resultId ? updated : item))
        )
      } catch (err) {
        setVerificationResults((items) =>
          items.map((item) => (item.id === resultId ? current : item))
        )
        throw err
      }
    },
    [projectId, selectedRunId, verificationResults]
  )

  const startRun = useCallback(
    async (runId: string) => {
      if (!projectId) return
      await qualityApi.startTestRun(projectId, runId)
      await loadRuns()
      await loadResults()
      await loadMembership()
    },
    [loadMembership, loadResults, loadRuns, projectId]
  )

  const cancelRun = useCallback(
    async (runId: string) => {
      if (!projectId) return
      await qualityApi.cancelTestRun(projectId, runId)
      await loadRuns()
      await loadResults()
    },
    [loadResults, loadRuns, projectId]
  )

  return {
    runs,
    selectedRun,
    selectedRunId,
    setSelectedRunId,
    runScope,
    showsFunctionalResults,
    showsVerificationResults,
    results,
    verificationResults,
    membership,
    resultTotal,
    loadingRuns,
    loadingResults,
    error,
    query,
    setQuery,
    resultFilter,
    setResultFilter,
    assigneeId,
    setAssigneeId,
    hasDefect,
    setHasDefect,
    refetch: loadRuns,
    refetchRuns: loadRuns,
    refetchResults: loadResults,
    refetchMembership: loadMembership,
    updateResult,
    batchUpdateResults,
    updateVerificationResult,
    startRun,
    cancelRun,
  }
}
