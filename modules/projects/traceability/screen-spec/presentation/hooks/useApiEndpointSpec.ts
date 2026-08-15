'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../../api/traceability.api'
import type { RegistryApiEndpoint, UpdateRegistryApiEndpointBody } from '../../../model/application-registry'

export function useApiEndpointSpec(
  workspaceId: string | null,
  applicationId: string | null,
  endpointId: string | null
) {
  const [endpoint, setEndpoint] = useState<RegistryApiEndpoint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !applicationId || !endpointId) {
      setEndpoint(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await api.getApiEndpoint(workspaceId, applicationId, endpointId)
      setEndpoint(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API')
      setEndpoint(null)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, applicationId, endpointId])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(
    async (body: UpdateRegistryApiEndpointBody) => {
      if (!workspaceId || !applicationId || !endpointId) return
      const next = await api.updateApiEndpoint(workspaceId, applicationId, endpointId, body)
      setEndpoint(next)
    },
    [workspaceId, applicationId, endpointId]
  )

  return { endpoint, loading, error, refetch: load, save }
}
