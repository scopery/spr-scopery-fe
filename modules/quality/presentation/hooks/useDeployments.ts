'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/quality.api'
import type {
  DeploymentEnvironment,
  DeploymentItem,
  RollbackPlan,
} from '../../infrastructure/api/quality.api'

const QUALITY_REPORT_KEYS = [
  'quality-dashboard',
  'defects',
  'release-readiness',
  'test-execution',
  'test-coverage',
  'defect-aging',
  'deployment-history',
] as const

export function useDeployments(projectId: string | null) {
  const [items, setItems] = useState<DeploymentItem[]>([])
  const [environments, setEnvironments] = useState<DeploymentEnvironment[]>([])
  const [rollbackPlans, setRollbackPlans] = useState<RollbackPlan[]>([])
  const [reports, setReports] = useState<Record<string, Record<string, unknown>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [dep, env, plans, ...reportResults] = await Promise.all([
        api.listDeployments(projectId),
        api.listDeploymentEnvironments(projectId),
        api.listRollbackPlans(projectId),
        ...QUALITY_REPORT_KEYS.map((key) =>
          api.getQualityReport(projectId, key).catch(() => ({} as Record<string, unknown>))
        ),
      ])
      setItems(dep.items)
      setEnvironments(env.items)
      setRollbackPlans(plans.items)
      const next: Record<string, Record<string, unknown>> = {}
      QUALITY_REPORT_KEYS.forEach((key, i) => {
        next[key] = reportResults[i] as Record<string, unknown>
      })
      setReports(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deployments')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const start = useCallback(
    async (id: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.startDeployment(projectId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Start deployment failed')
      }
    },
    [projectId, load]
  )

  const succeed = useCallback(
    async (id: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.succeedDeployment(projectId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Mark succeed failed')
      }
    },
    [projectId, load]
  )

  const fail = useCallback(
    async (id: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.failDeployment(projectId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Mark fail failed')
      }
    },
    [projectId, load]
  )

  const rollback = useCallback(
    async (id: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.rollbackDeployment(projectId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Rollback failed')
      }
    },
    [projectId, load]
  )

  const archiveEnv = useCallback(
    async (id: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.archiveDeploymentEnvironment(projectId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Archive environment failed')
      }
    },
    [projectId, load]
  )

  const approveRollback = useCallback(
    async (id: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.approveRollbackPlan(projectId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Approve rollback plan failed')
      }
    },
    [projectId, load]
  )

  return {
    items,
    environments,
    rollbackPlans,
    reports,
    loading,
    error,
    actionError,
    refetch: load,
    start,
    succeed,
    fail,
    rollback,
    archiveEnv,
    approveRollback,
  }
}
