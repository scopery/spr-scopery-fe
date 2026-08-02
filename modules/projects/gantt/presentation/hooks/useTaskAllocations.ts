'use client'

import { useCallback, useEffect, useState } from 'react'
import type { TaskAllocationPlan } from '../../domain/model/allocation'
import type { TimelineBaseline } from '../../infrastructure/api/allocation.local'
import * as allocLocal from '../../infrastructure/api/allocation.local'
import * as allocApi from '../../infrastructure/api/allocation.api'

export function useTaskAllocations(projectId: string | null) {
  const [byTaskId, setByTaskId] = useState<Record<string, TaskAllocationPlan>>({})
  const [baseline, setBaseline] = useState<TimelineBaseline>({})
  const [source, setSource] = useState<'api' | 'local'>('local')

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    void (async () => {
      const res = await allocApi.listAllocationsForProject(projectId)
      if (cancelled) return
      setByTaskId(res.byTaskId)
      setSource(res.source)
      setBaseline(allocLocal.loadLocalBaseline(projectId))
    })()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const saveAllocation = useCallback(
    async (plan: TaskAllocationPlan) => {
      if (!projectId) return
      const res = await allocApi.saveAllocationPlan(projectId, plan)
      setByTaskId((prev) => ({ ...prev, [plan.taskId]: plan }))
      setSource(res.source)
    },
    [projectId]
  )

  const clearAllocation = useCallback(
    async (taskId: string) => {
      if (!projectId) return
      const res = await allocApi.clearAllocationPlan(projectId, taskId)
      setByTaskId((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      setSource(res.source)
    },
    [projectId]
  )

  const captureBaseline = useCallback(
    (
      rows: Array<{
        sourceEntityId: string | null
        startDate: string | null
        endDate: string | null
      }>
    ) => {
      if (!projectId) return
      const next: TimelineBaseline = {}
      const capturedAt = new Date().toISOString()
      for (const row of rows) {
        if (!row.sourceEntityId) continue
        next[row.sourceEntityId] = {
          startDate: row.startDate,
          endDate: row.endDate,
          capturedAt,
        }
      }
      allocLocal.saveLocalBaseline(projectId, next)
      setBaseline(next)
    },
    [projectId]
  )

  return {
    byTaskId,
    baseline,
    source,
    saveAllocation,
    clearAllocation,
    captureBaseline,
  }
}
