'use client'

import { useCallback, useEffect, useState } from 'react'
import * as resourcesApi from '../../infrastructure/api/resources.api'
import * as catalogApi from '../../infrastructure/api/resource-catalog.api'
import type {
  CreateResourceProfilePayload,
  ResourceProfile,
  SyncFromMembersResult,
} from '../../domain/model/resource-profile'
import type { ResourceRole } from '../../domain/model/resource-catalog'
import { ResourceProfileStatus, ResourceType } from '../../domain/enums/capacity.enum'
import { canArchiveResource } from '../../domain/rules/capacity.rules'

export function useResourceProfiles(workspaceId: string | null) {
  const [items, setItems] = useState<ResourceProfile[]>([])
  const [roles, setRoles] = useState<ResourceRole[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<SyncFromMembersResult | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [keyword, setKeyword] = useState('')

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [profiles, roleList] = await Promise.all([
        resourcesApi.listResourceProfiles(workspaceId),
        catalogApi.listResourceRoles(workspaceId),
      ])
      setItems(profiles)
      setRoles(roleList)
      setSelectedId((current) => current ?? profiles[0]?.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = items.filter((item) => {
    if (typeFilter !== 'ALL' && item.resourceType !== typeFilter) return false
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase()
      if (!item.displayName.toLowerCase().includes(q)) return false
    }
    return true
  })

  const selected = items.find((i) => i.id === selectedId) ?? null

  const createResource = useCallback(
    async (body: CreateResourceProfilePayload) => {
      if (!workspaceId) return
      setCreating(true)
      try {
        const created = await resourcesApi.createResourceProfile(workspaceId, body)
        await load()
        setSelectedId(created.id)
      } finally {
        setCreating(false)
      }
    },
    [workspaceId, load]
  )

  const archiveResource = useCallback(
    async (resourceId: string) => {
      if (!workspaceId) return
      await resourcesApi.archiveResourceProfile(workspaceId, resourceId)
      await load()
    },
    [workspaceId, load]
  )

  const syncFromMembers = useCallback(async () => {
    if (!workspaceId) return
    setSyncing(true)
    try {
      const result = await resourcesApi.syncResourcesFromMembers(workspaceId)
      setLastSync(result)
      await load()
      return result
    } finally {
      setSyncing(false)
    }
  }, [workspaceId, load])

  const roleName = useCallback(
    (roleId: string | null) => {
      if (!roleId) return '—'
      return roles.find((r) => r.id === roleId)?.name ?? roleId.slice(0, 8)
    },
    [roles]
  )

  return {
    items: filtered,
    allItems: items,
    roles,
    selected,
    selectedId,
    setSelectedId,
    loading,
    error,
    creating,
    syncing,
    lastSync,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    keyword,
    setKeyword,
    refetch: load,
    createResource,
    archiveResource,
    syncFromMembers,
    roleName,
    canArchive: (r: ResourceProfile) => canArchiveResource(r),
    ResourceType,
    ResourceProfileStatus,
  }
}
