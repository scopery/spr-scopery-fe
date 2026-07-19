'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/project-governance.api'
import type {
  GovernanceAccessGrant,
  GovernanceLock,
  GovernanceOwnership,
  GovernancePackSummary,
  GovernanceVersion,
} from '../api/project-governance.api'

export function useProjectGovernance(projectId: string | null) {
  const [ownership, setOwnership] = useState<GovernanceOwnership[]>([])
  const [locks, setLocks] = useState<GovernanceLock[]>([])
  const [pack, setPack] = useState<GovernancePackSummary | null>(null)
  const [objectTypes, setObjectTypes] = useState<Array<{ code: string; name?: string }>>([])
  const [baselineCheck, setBaselineCheck] = useState<{
    allowed: boolean
    reason?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [selected, setSelected] = useState<{
    objectTypeCode: string
    targetId: string
  } | null>(null)
  const [grants, setGrants] = useState<GovernanceAccessGrant[]>([])
  const [versions, setVersions] = useState<GovernanceVersion[]>([])

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [own, locked, packRes, types] = await Promise.all([
        api.listProjectOwnership(projectId),
        api.listLockedObjects(projectId),
        api.getGovernancePack(projectId),
        api.listGovernanceObjectTypes(),
      ])
      setOwnership(own.items)
      setLocks(locked.items)
      setPack(packRes)
      setObjectTypes(types.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load governance')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const selectObject = useCallback(
    async (objectTypeCode: string, targetId: string) => {
      if (!projectId) return
      setSelected({ objectTypeCode, targetId })
      setActionError(null)
      try {
        const [grantRes, versionRes] = await Promise.all([
          api.listAccessGrants(projectId, objectTypeCode, targetId),
          api.listGovernanceVersions(projectId, objectTypeCode, targetId),
        ])
        setGrants(grantRes.items)
        setVersions(versionRes.items)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to load object')
      }
    },
    [projectId]
  )

  const releaseSelectedLock = useCallback(
    async (lockId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.releaseLock(projectId, lockId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Release failed')
      }
    },
    [projectId, load]
  )

  const finalizeSelected = useCallback(
    async (reason: string) => {
      if (!projectId || !selected) return
      setActionError(null)
      try {
        await api.finalizeObject(
          projectId,
          selected.objectTypeCode,
          selected.targetId,
          reason
        )
        await load()
        await selectObject(selected.objectTypeCode, selected.targetId)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Finalize failed')
      }
    },
    [projectId, selected, load, selectObject]
  )

  const revokeGrant = useCallback(
    async (grantId: string) => {
      if (!projectId || !selected) return
      setActionError(null)
      try {
        await api.revokeAccessGrant(projectId, grantId)
        await selectObject(selected.objectTypeCode, selected.targetId)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Revoke failed')
      }
    },
    [projectId, selected, selectObject]
  )

  const runBaselineGuard = useCallback(async () => {
    if (!projectId) return
    setActionError(null)
    try {
      const res = await api.checkBaselineGuard(projectId, selected ?? undefined)
      setBaselineCheck(res)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Baseline guard failed')
    }
  }, [projectId, selected])

  return {
    ownership,
    locks,
    pack,
    objectTypes,
    baselineCheck,
    selected,
    grants,
    versions,
    loading,
    error,
    actionError,
    refetch: load,
    selectObject,
    releaseSelectedLock,
    finalizeSelected,
    revokeGrant,
    runBaselineGuard,
  }
}
