'use client'

import { useCallback, useEffect, useState } from 'react'
import * as productivityApi from '../../infrastructure/api/productivity.api'
import type { FavoriteItem, RecentItem, SavedView } from '../../domain/model/saved-items'

export function useSavedItems(workspaceId: string | null) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [savedSearches, setSavedSearches] = useState<
    Array<{ id: string; name?: string; query?: string }>
  >([])
  const [pins, setPins] = useState<Array<{ id: string; title?: string }>>([])
  const [navPrefs, setNavPrefs] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [f, r, v, s, p, prefs] = await Promise.all([
        productivityApi.listFavorites(workspaceId),
        productivityApi.listRecent(workspaceId),
        productivityApi.listSavedViews(workspaceId),
        productivityApi.listSavedSearches(workspaceId),
        productivityApi.listPins(workspaceId),
        productivityApi.getNavigationPreferences(workspaceId),
      ])
      setFavorites(f)
      setRecent(r)
      setSavedViews(v)
      setSavedSearches(s)
      setPins(p)
      setNavPrefs(prefs)
      await productivityApi.getNavigation(workspaceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved items')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return {
    favorites,
    recent,
    savedViews,
    savedSearches,
    pins,
    navPrefs,
    loading,
    error,
    refetch: load,
  }
}
