'use client'

import { useCallback, useEffect, useState } from 'react'
import * as profilesApi from '../../infrastructure/api/user-profiles.api'
import { doEffectiveRangesOverlap } from '../../domain/rules/capacity.rules'
import type {
  CreateUserCapacityProfilePayload,
  UserCapacityProfile,
} from '../../domain/model/user-capacity-profile'

export function useUserCapacityProfiles(workspaceId: string | null) {
  const [items, setItems] = useState<UserCapacityProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await profilesApi.listUserCapacityProfiles({
        workspaceId,
        page: 0,
        size: 100,
      })
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load capacity profiles')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const findOverlaps = useCallback(
    (memberId: string, from: string, to: string | null | undefined) => {
      return items.filter(
        (p) =>
          p.workspaceMemberId === memberId &&
          doEffectiveRangesOverlap(p.effectiveFrom, p.effectiveTo, from, to)
      )
    },
    [items]
  )

  const createProfile = useCallback(
    async (body: CreateUserCapacityProfilePayload) => {
      if (!workspaceId) return
      setCreating(true)
      try {
        await profilesApi.createUserCapacityProfile(workspaceId, body)
        await load()
      } finally {
        setCreating(false)
      }
    },
    [workspaceId, load]
  )

  const activate = useCallback(
    async (profileId: string) => {
      await profilesApi.activateUserCapacityProfile(profileId)
      await load()
    },
    [load]
  )

  const deactivate = useCallback(
    async (profileId: string) => {
      await profilesApi.deactivateUserCapacityProfile(profileId)
      await load()
    },
    [load]
  )

  const archive = useCallback(
    async (profileId: string) => {
      await profilesApi.archiveUserCapacityProfile(profileId)
      await load()
    },
    [load]
  )

  return {
    items,
    loading,
    error,
    creating,
    refetch: load,
    findOverlaps,
    createProfile,
    activate,
    deactivate,
    archive,
  }
}
