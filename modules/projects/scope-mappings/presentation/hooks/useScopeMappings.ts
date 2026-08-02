'use client'

import { useCallback, useEffect, useState } from 'react'
import * as scopeMappingsApi from '../../infrastructure/api/scope-mappings.api'
import type { ScopeWbsMapping } from '../../domain/model/scope-mapping'

export function useScopeMappings(scopeItemId: string | null) {
  const [wbsMappings, setWbsMappings] = useState<ScopeWbsMapping[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!scopeItemId) return
    setLoading(true)
    setError(null)
    try {
      const data = await scopeMappingsApi.listWbsMappings(scopeItemId)
      setWbsMappings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load planning element mappings')
    } finally {
      setLoading(false)
    }
  }, [scopeItemId])

  useEffect(() => {
    void load()
  }, [load])

  const mapToWbs = useCallback(
    async (wbsNodeId: string) => {
      if (!scopeItemId) return
      await scopeMappingsApi.createWbsMapping(scopeItemId, { wbsNodeId })
      await load()
    },
    [scopeItemId, load]
  )

  const unmapFromWbs = useCallback(
    async (mappingId: string) => {
      await scopeMappingsApi.deleteWbsMapping(mappingId)
      await load()
    },
    [load]
  )

  return { wbsMappings, loading, error, mapToWbs, unmapFromWbs, refetch: load }
}
