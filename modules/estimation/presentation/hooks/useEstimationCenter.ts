'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as estimationApi from '../../infrastructure/api/estimation.api'
import { isEstimationRunning } from '../../domain/rules/estimation.rules'
import type {
  CreateEstimationRunPayload,
  EstimationRun,
  ProjectEstimateSummary,
} from '../../domain/model/estimation'

const POLL_MS = 3000

export function useEstimationCenter(projectId: string | null) {
  const [runs, setRuns] = useState<EstimationRun[]>([])
  const [currentRun, setCurrentRun] = useState<EstimationRun | null>(null)
  const [currentSummary, setCurrentSummary] = useState<ProjectEstimateSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const list = await estimationApi.listEstimationRuns(projectId)
      setRuns(list)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load estimation runs')
      setRuns([])
    } finally {
      setLoading(false)
    }

    try {
      const [current, summary] = await Promise.all([
        estimationApi.getCurrentEstimation(projectId),
        estimationApi.getCurrentEstimationSummary(projectId),
      ])
      setCurrentRun(current)
      setCurrentSummary(summary)
    } catch {
      setCurrentRun(null)
      setCurrentSummary(null)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!projectId) return
    const hasRunning = runs.some(isEstimationRunning)
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (!hasRunning) return
    pollRef.current = setInterval(() => {
      void load()
    }, POLL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [projectId, runs, load])

  const createRun = useCallback(
    async (body: CreateEstimationRunPayload) => {
      if (!projectId) return null
      setCreating(true)
      try {
        const created = await estimationApi.createEstimationRun(projectId, body)
        await load()
        return created
      } finally {
        setCreating(false)
      }
    },
    [projectId, load]
  )

  const cancelRun = useCallback(
    async (runId: string) => {
      if (!projectId) return null
      const result = await estimationApi.cancelEstimationRun(projectId, runId)
      await load()
      return result
    },
    [projectId, load]
  )

  const markCurrent = useCallback(
    async (runId: string) => {
      if (!projectId) return null
      const result = await estimationApi.markEstimationCurrent(projectId, runId)
      await load()
      return result
    },
    [projectId, load]
  )

  return {
    runs,
    currentRun,
    currentSummary,
    loading,
    creating,
    error,
    forbidden,
    refetch: load,
    createRun,
    cancelRun,
    markCurrent,
  }
}
