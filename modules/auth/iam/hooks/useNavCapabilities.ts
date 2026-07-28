'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as capabilitiesApi from '../api/capabilities.api'
import type { NavCapabilityKey, NavCapabilityPack } from '../model/nav-capabilities'

export function useNavCapabilities(
  opts: {
    workspaceId?: string | null
    organizationId?: string | null
    projectId?: string | null
    packs: NavCapabilityPack[]
  }
) {
  const { workspaceId, organizationId, projectId, packs } = opts
  const packsKey = packs.join(',')
  const requestKey = `${workspaceId ?? ''}|${organizationId ?? ''}|${projectId ?? ''}|${packsKey}`

  const [caps, setCaps] = useState<Record<string, boolean>>({})
  const [resolvedKey, setResolvedKey] = useState<string | null>(null)
  const [fetching, setFetching] = useState(() => packs.length > 0)
  const [error, setError] = useState<string | null>(null)

  // When scope/packs change, mark stale synchronously (same render) so deep-link
  // guards do not evaluate the previous pack's capabilities against the new URL.
  const [trackedKey, setTrackedKey] = useState(requestKey)
  if (trackedKey !== requestKey) {
    setTrackedKey(requestKey)
    setFetching(packs.length > 0)
  }

  const stale = resolvedKey !== requestKey
  const loading = packs.length > 0 && (stale || fetching)
  const ready = !stale && resolvedKey !== null && !error

  const load = useCallback(async () => {
    if (!packs.length) {
      setCaps({})
      setResolvedKey(null)
      setFetching(false)
      return
    }
    const needsWs = packs.some((p) => p !== 'NAV_ORG')
    const needsOrg = packs.some((p) => p === 'NAV_ORG')
    if (needsWs && !workspaceId) return
    if (needsOrg && !organizationId) return

    const keyAtStart = requestKey
    setFetching(true)
    setError(null)
    try {
      const results = await Promise.all(
        packs.map(async (pack) => {
          if (pack === 'NAV_ORG') {
            return capabilitiesApi.getOrganizationCapabilities(organizationId!, pack)
          }
          if (pack === 'NAV_PROJECT') {
            return capabilitiesApi.getWorkspaceCapabilities(workspaceId!, pack, {
              projectId: projectId ?? null,
            })
          }
          return capabilitiesApi.getWorkspaceCapabilities(workspaceId!, pack)
        })
      )
      const merged: Record<string, boolean> = {}
      for (const res of results) {
        Object.assign(merged, res.capabilities)
      }
      setCaps(merged)
      setResolvedKey(keyAtStart)
    } catch (err) {
      setCaps({})
      setResolvedKey(null)
      setError(err instanceof Error ? err.message : 'Failed to load capabilities')
    } finally {
      setFetching(false)
    }
  }, [workspaceId, organizationId, projectId, packsKey, requestKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  const can = useCallback(
    (key: NavCapabilityKey | string) => caps[key] === true,
    [caps]
  )

  return useMemo(
    () => ({ caps, can, loading, ready, error, refetch: load }),
    [caps, can, loading, ready, error, load]
  )
}
