'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CreateSpecPackInput, SpecPack, SpecPackGroup } from '../model/spec-pack'
import { specPackLocalStore } from '../store/spec-pack.local-store'

export function useSpecPacks(workspaceId: string | null, projectId: string | null) {
  const [packs, setPacks] = useState<SpecPack[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    if (!projectId) {
      setPacks([])
      setLoading(false)
      return
    }
    setPacks(specPackLocalStore.list(projectId))
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    reload()
  }, [reload])

  const createPack = useCallback(
    (input: CreateSpecPackInput) => {
      if (!workspaceId || !projectId) throw new Error('Missing workspace/project')
      const pack = specPackLocalStore.create(workspaceId, projectId, input)
      reload()
      return pack
    },
    [workspaceId, projectId, reload]
  )

  const markExported = useCallback(
    (packId: string) => {
      if (!projectId) return null
      const updated = specPackLocalStore.markExported(projectId, packId)
      reload()
      return updated
    },
    [projectId, reload]
  )

  const removePack = useCallback(
    (packId: string) => {
      if (!projectId) return
      specPackLocalStore.remove(projectId, packId)
      reload()
    },
    [projectId, reload]
  )

  const updateGroups = useCallback(
    (packId: string, groups: SpecPackGroup[]) => {
      if (!projectId) return null
      const updated = specPackLocalStore.updateGroups(projectId, packId, groups)
      if (updated) reload()
      return updated
    },
    [projectId, reload]
  )

  const getPack = useCallback(
    (packId: string) => {
      if (!projectId) return null
      return specPackLocalStore.get(projectId, packId)
    },
    [projectId]
  )

  return {
    packs,
    loading,
    reload,
    createPack,
    markExported,
    removePack,
    updateGroups,
    getPack,
  }
}
