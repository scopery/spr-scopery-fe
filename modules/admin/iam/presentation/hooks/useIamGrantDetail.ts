'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamGrantsApi, iamRightsApi } from '@/modules/auth/iam'
import type {
  IamGrant,
  IamGrantPermissionAction,
  IamGrantRight,
  IamRight,
} from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useIamGrantDetail(grantId: string | null) {
  const [grant, setGrant] = useState<IamGrant | null>(null)
  const [grantRights, setGrantRights] = useState<IamGrantRight[]>([])
  const [rightsById, setRightsById] = useState<Record<string, IamRight>>({})
  const [actions, setActions] = useState<IamGrantPermissionAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!grantId) return
    setLoading(true)
    setError(null)
    try {
      const [g, rightsList, actionsList] = await Promise.all([
        iamGrantsApi.getGrant(grantId),
        iamGrantsApi.listGrantRights(grantId),
        iamGrantsApi.listGrantActions(grantId).catch(() => [] as IamGrantPermissionAction[]),
      ])
      setGrant(g)
      setGrantRights(rightsList)
      setActions(actionsList)

      const resolved = await Promise.all(
        rightsList.map(async (row) => {
          try {
            return await iamRightsApi.getRight(row.rightId)
          } catch {
            return null
          }
        })
      )
      const next: Record<string, IamRight> = {}
      resolved.forEach((right) => {
        if (right) next[right.id] = right
      })
      setRightsById(next)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load grant'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [grantId])

  useEffect(() => {
    void load()
  }, [load])

  const revoke = useCallback(async () => {
    if (!grantId) return
    setRevoking(true)
    try {
      await iamGrantsApi.revokeGrant(grantId)
      toast.success('Grant revoked')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setRevoking(false)
    }
  }, [grantId, load])

  const addRight = useCallback(
    async (rightId: string) => {
      if (!grantId || !rightId.trim()) return
      setActing(true)
      try {
        await iamGrantsApi.addGrantRight(grantId, { rightId: rightId.trim() })
        toast.success('Right attached')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setActing(false)
      }
    },
    [grantId, load]
  )

  const removeRight = useCallback(
    async (rightId: string) => {
      if (!grantId) return
      setActing(true)
      try {
        await iamGrantsApi.removeGrantRight(grantId, rightId)
        toast.success('Right removed')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setActing(false)
      }
    },
    [grantId, load]
  )

  const addAction = useCallback(
    async (payload: { permissionActionId?: string; permissionCode?: string; actionCode?: string }) => {
      if (!grantId) return
      setActing(true)
      try {
        await iamGrantsApi.addGrantAction(grantId, payload)
        toast.success('Permission action attached')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setActing(false)
      }
    },
    [grantId, load]
  )

  const removeAction = useCallback(
    async (permissionActionId: string) => {
      if (!grantId) return
      setActing(true)
      try {
        await iamGrantsApi.removeGrantAction(grantId, permissionActionId)
        toast.success('Permission action removed')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setActing(false)
      }
    },
    [grantId, load]
  )

  return {
    grant,
    grantRights,
    rightsById,
    actions,
    loading,
    error,
    revoking,
    acting,
    refetch: load,
    revoke,
    addRight,
    removeRight,
    addAction,
    removeAction,
  }
}
