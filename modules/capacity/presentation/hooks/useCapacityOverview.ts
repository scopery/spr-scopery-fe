'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as calcApi from '../../infrastructure/api/capacity-calculation.api'
import * as resourcesApi from '../../infrastructure/api/resources.api'
import type {
  CapacityOverview,
  OverAllocationItem,
} from '../../domain/model/capacity-overview'
import type { ResourceProfile } from '../../domain/model/resource-profile'

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 27)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { fromDate: fmt(from), toDate: fmt(to) }
}

export function useCapacityOverview(workspaceId: string | null) {
  const initial = useMemo(() => defaultRange(), [])
  const [fromDate, setFromDate] = useState(initial.fromDate)
  const [toDate, setToDate] = useState(initial.toDate)
  const [overview, setOverview] = useState<CapacityOverview | null>(null)
  const [overAllocations, setOverAllocations] = useState<OverAllocationItem[]>([])
  const [resources, setResources] = useState<ResourceProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [ov, over, profiles] = await Promise.all([
        calcApi.getWorkspaceCapacityOverview(workspaceId, { fromDate, toDate }),
        calcApi.listOverAllocations({ workspaceId, fromDate, toDate }),
        resourcesApi.listResourceProfiles(workspaceId),
      ])
      setOverview(ov)
      setOverAllocations(over)
      setResources(profiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load capacity overview')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, fromDate, toDate])

  useEffect(() => {
    void load()
  }, [load])

  const syncFromMembers = useCallback(async () => {
    if (!workspaceId) return
    setSyncing(true)
    try {
      await resourcesApi.syncResourcesFromMembers(workspaceId)
      await load()
    } finally {
      setSyncing(false)
    }
  }, [workspaceId, load])

  const hasResources = resources.length > 0

  return {
    overview,
    overAllocations,
    resources,
    hasResources,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    loading,
    error,
    syncing,
    refetch: load,
    syncFromMembers,
  }
}
