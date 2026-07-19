'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/support.api'
import type {
  MaintenancePlan,
  SupportIncident,
  SupportProblem,
} from '../../infrastructure/api/support.api'

export function useSupportOps(workspaceId: string | null) {
  const [incidents, setIncidents] = useState<SupportIncident[]>([])
  const [problems, setProblems] = useState<SupportProblem[]>([])
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [i, p, m] = await Promise.all([
        api.listIncidents(workspaceId),
        api.listProblems(workspaceId),
        api.listMaintenancePlans(workspaceId),
      ])
      setIncidents(i.items)
      setProblems(p.items)
      setMaintenancePlans(m.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support ops')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const acknowledgeIncident = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.acknowledgeIncident(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Acknowledge failed')
      }
    },
    [workspaceId, load]
  )

  const resolveIncident = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.resolveIncident(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Resolve incident failed')
      }
    },
    [workspaceId, load]
  )

  const closeIncident = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.closeIncident(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Close incident failed')
      }
    },
    [workspaceId, load]
  )

  const resolveProblem = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.resolveProblem(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Resolve problem failed')
      }
    },
    [workspaceId, load]
  )

  const closeProblem = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.closeProblem(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Close problem failed')
      }
    },
    [workspaceId, load]
  )

  return {
    incidents,
    problems,
    maintenancePlans,
    loading,
    error,
    actionError,
    refetch: load,
    acknowledgeIncident,
    resolveIncident,
    closeIncident,
    resolveProblem,
    closeProblem,
  }
}
