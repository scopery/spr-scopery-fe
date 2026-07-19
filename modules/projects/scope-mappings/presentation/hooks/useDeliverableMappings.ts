'use client'

import { useCallback, useEffect, useState } from 'react'
import * as scopeMappingsApi from '../../infrastructure/api/scope-mappings.api'
import type { DeliverableTaskMapping } from '../../domain/model/scope-mapping'

export function useDeliverableMappings(deliverableId: string | null) {
  const [taskMappings, setTaskMappings] = useState<DeliverableTaskMapping[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!deliverableId) return
    setLoading(true)
    setError(null)
    try {
      const data = await scopeMappingsApi.listTaskMappings(deliverableId)
      setTaskMappings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task mappings')
    } finally {
      setLoading(false)
    }
  }, [deliverableId])

  useEffect(() => {
    void load()
  }, [load])

  const mapToTask = useCallback(
    async (taskId: string) => {
      if (!deliverableId) return
      await scopeMappingsApi.createTaskMapping(deliverableId, { taskId })
      await load()
    },
    [deliverableId, load]
  )

  const unmapFromTask = useCallback(
    async (mappingId: string) => {
      await scopeMappingsApi.deleteTaskMapping(mappingId)
      await load()
    },
    [load]
  )

  return { taskMappings, loading, error, mapToTask, unmapFromTask, refetch: load }
}
