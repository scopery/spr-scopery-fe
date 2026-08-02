'use client'

import { useCallback, useEffect, useState } from 'react'
import * as progressApi from '../../infrastructure/api/progress-snapshot.api'
import type {
  CreateProgressSnapshotPayload,
  TaskProgressSnapshot,
} from '../../domain/model/progress-snapshot'

export function useTaskProgressSnapshots(
  projectId: string | null,
  taskIds: string[]
) {
  const [snapshots, setSnapshots] = useState<TaskProgressSnapshot[]>([])
  const [source, setSource] = useState<'api' | 'local'>('local')
  const [loading, setLoading] = useState(false)
  const taskKey = taskIds.slice().sort().join(',')

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await progressApi.listProgressSnapshotsForProject(
        projectId,
        taskIds
      )
      setSnapshots(res.items)
      setSource(res.source)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- taskKey captures taskIds
  }, [projectId, taskKey])

  useEffect(() => {
    void load()
  }, [load])

  const recordProgress = useCallback(
    async (taskId: string, body: CreateProgressSnapshotPayload) => {
      if (!projectId) return null
      const res = await progressApi.createProgressSnapshot(projectId, taskId, body)
      setSnapshots((prev) => {
        const withoutSameDay = prev.filter(
          (s) =>
            !(s.taskId === taskId && s.snapshotDate === res.snapshot.snapshotDate)
        )
        return [...withoutSameDay, res.snapshot]
      })
      setSource(res.source)
      return res.snapshot
    },
    [projectId]
  )

  return {
    snapshots,
    source,
    loading,
    refetch: load,
    recordProgress,
  }
}
