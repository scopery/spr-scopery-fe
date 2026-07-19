'use client'

import { useCallback, useEffect, useState } from 'react'
import * as raidLinksApi from '../../infrastructure/api/raid-links.api'
import type { CreateRaidLinkPayload, RaidLink } from '../../domain/model/raid-link'

export function useRaidLinks(projectId: string | null, raidItemId: string | null) {
  const [links, setLinks] = useState<RaidLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !raidItemId) {
      setLinks([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await raidLinksApi.listRaidLinks(projectId, raidItemId)
      setLinks(res ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links')
      setLinks([])
    } finally {
      setLoading(false)
    }
  }, [projectId, raidItemId])

  useEffect(() => {
    void load()
  }, [load])

  const createLink = useCallback(
    async (body: CreateRaidLinkPayload) => {
      if (!projectId || !raidItemId) return null
      const created = await raidLinksApi.createRaidLink(projectId, raidItemId, body)
      await load()
      return created
    },
    [projectId, raidItemId, load]
  )

  const removeLink = useCallback(
    async (linkId: string) => {
      if (!projectId || !raidItemId) return
      await raidLinksApi.deleteRaidLink(projectId, raidItemId, linkId)
      await load()
    },
    [projectId, raidItemId, load]
  )

  return { links, loading, error, refetch: load, createLink, removeLink }
}
