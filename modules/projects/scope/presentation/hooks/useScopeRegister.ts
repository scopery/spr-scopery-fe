'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as scopeApi from '../../infrastructure/api/scope.api'
import type {
  CreateScopeItemPayload,
  CreateScopePackagePayload,
  ScopeItem,
  ScopePackage,
  UpdateScopeItemPayload,
} from '../../domain/model/scope'

export function useScopeRegister(projectId: string | null) {
  const [packages, setPackages] = useState<ScopePackage[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [items, setItems] = useState<ScopeItem[]>([])
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const loadPackages = useCallback(async () => {
    if (!projectId) return
    setLoadingPackages(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await scopeApi.listScopePackages(projectId)
      setPackages(res ?? [])
      setSelectedPackageId((prev) => {
        if (prev && res.some((p) => p.id === prev)) return prev
        const current = res.find((p) => p.currentFlag)
        return current?.id ?? res[0]?.id ?? null
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load scope packages')
      setPackages([])
    } finally {
      setLoadingPackages(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadPackages()
  }, [loadPackages])

  const loadItems = useCallback(async () => {
    if (!projectId || !selectedPackageId) {
      setItems([])
      return
    }
    setLoadingItems(true)
    try {
      const res = await scopeApi.listScopeItems(projectId, selectedPackageId)
      setItems(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setItems([])
    } finally {
      setLoadingItems(false)
    }
  }, [projectId, selectedPackageId])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const createPackage = useCallback(
    async (body: CreateScopePackagePayload) => {
      if (!projectId) return null
      const created = await scopeApi.createScopePackage(projectId, body)
      await loadPackages()
      return created
    },
    [projectId, loadPackages]
  )

  const createItem = useCallback(
    async (body: CreateScopeItemPayload) => {
      if (!projectId || !selectedPackageId) return null
      const created = await scopeApi.createScopeItem(projectId, selectedPackageId, body)
      await loadItems()
      return created
    },
    [projectId, selectedPackageId, loadItems]
  )

  const updateItem = useCallback(
    async (scopeItemId: string, body: UpdateScopeItemPayload) => {
      if (!projectId) return null
      const updated = await scopeApi.updateScopeItem(projectId, scopeItemId, body)
      await loadItems()
      return updated
    },
    [projectId, loadItems]
  )

  const classifyItem = useCallback(
    async (item: ScopeItem, classification: 'in' | 'out' | 'unclassified') => {
      if (!projectId) return null
      const body: UpdateScopeItemPayload =
        classification === 'in'
          ? { inScope: true, outOfScope: false }
          : classification === 'out'
            ? { inScope: false, outOfScope: true }
            : { inScope: false, outOfScope: false }
      const updated = await scopeApi.updateScopeItem(projectId, item.id, body)
      await loadItems()
      return updated
    },
    [projectId, loadItems]
  )

  const archiveItem = useCallback(
    async (scopeItemId: string) => {
      if (!projectId) return null
      const updated = await scopeApi.archiveScopeItem(projectId, scopeItemId)
      await loadItems()
      return updated
    },
    [projectId, loadItems]
  )

  const approvePackage = useCallback(
    async (packageId: string) => {
      if (!projectId) return null
      const updated = await scopeApi.approveScopePackage(projectId, packageId)
      await loadPackages()
      return updated
    },
    [projectId, loadPackages]
  )

  const markCurrentPackage = useCallback(
    async (packageId: string) => {
      if (!projectId) return null
      const updated = await scopeApi.markCurrentScopePackage(projectId, packageId)
      await loadPackages()
      return updated
    },
    [projectId, loadPackages]
  )

  const archivePackage = useCallback(
    async (packageId: string) => {
      if (!projectId) return null
      const updated = await scopeApi.archiveScopePackage(projectId, packageId)
      await loadPackages()
      return updated
    },
    [projectId, loadPackages]
  )

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedPackageId) ?? null,
    [packages, selectedPackageId]
  )

  return {
    packages,
    selectedPackage,
    selectedPackageId,
    setSelectedPackageId,
    items,
    loading: loadingPackages || loadingItems,
    loadingItems,
    error,
    forbidden,
    refetch: loadPackages,
    refetchItems: loadItems,
    createPackage,
    createItem,
    updateItem,
    classifyItem,
    archiveItem,
    approvePackage,
    markCurrentPackage,
    archivePackage,
  }
}
