'use client'

import { useCallback, useEffect, useState } from 'react'
import * as scopeApi from '../../infrastructure/api/scope.api'
import type { ScopePackageRequirement } from '../../domain/model/scope'

export function useScopePackageRequirements(
  projectId: string | null,
  packageId: string | null
) {
  const [requirements, setRequirements] = useState<ScopePackageRequirement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !packageId) {
      setRequirements([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const items = await scopeApi.listPackageRequirements(projectId, packageId)
      setRequirements(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements')
      setRequirements([])
    } finally {
      setLoading(false)
    }
  }, [projectId, packageId])

  useEffect(() => {
    void load()
  }, [load])

  const linkRequirements = useCallback(
    async (requirementIds: string[]) => {
      if (!projectId || !packageId || requirementIds.length === 0) return
      setActing(true)
      try {
        await scopeApi.linkRequirementsToPackage(projectId, packageId, requirementIds)
        await load()
      } finally {
        setActing(false)
      }
    },
    [projectId, packageId, load]
  )

  const unlinkRequirements = useCallback(
    async (requirementIds: string[]) => {
      if (!projectId || !packageId || requirementIds.length === 0) return
      setActing(true)
      try {
        await scopeApi.unlinkRequirementsFromPackage(projectId, packageId, requirementIds)
        await load()
      } finally {
        setActing(false)
      }
    },
    [projectId, packageId, load]
  )

  return {
    requirements,
    loading,
    error,
    acting,
    refetch: load,
    linkRequirements,
    unlinkRequirements,
  }
}
