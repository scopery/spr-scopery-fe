'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSpecPackPreviewDocument } from '../model/build-spec-pack-preview'
import type { SpecPack } from '../model/spec-pack'
import type { SpecPackPreviewDocument } from '../model/spec-pack-preview'
import { getCachedSpecPackPreview } from '../model/spec-pack-preview.cache'

export function useSpecPackPreview(workspaceId: string | null, pack: SpecPack | null) {
  const [document, setDocument] = useState<SpecPackPreviewDocument | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestSeq = useRef(0)

  const packKey = pack ? `${pack.id}:${pack.updatedAt}` : null

  const load = useCallback(
    async (mode: 'swr' | 'force' | 'hard' = 'swr') => {
      if (!workspaceId || !pack) {
        setDocument(null)
        setError(null)
        setLoading(false)
        setRefreshing(false)
        return
      }

      const seq = ++requestSeq.current
      const cached = getCachedSpecPackPreview(pack)

      // Fresh cache: paint immediately, no network
      if (mode === 'swr' && cached && !cached.stale) {
        setDocument(cached.doc)
        setError(null)
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Stale cache: paint now, revalidate in background (reuse entity cache)
      if (mode === 'swr' && cached?.stale) {
        setDocument(cached.doc)
        setError(null)
        setLoading(false)
        setRefreshing(true)
        try {
          const doc = await buildSpecPackPreviewDocument(workspaceId, pack, { force: true })
          if (seq !== requestSeq.current) return
          setDocument(doc)
        } catch {
          // Keep stale document; soft failure
        } finally {
          if (seq === requestSeq.current) setRefreshing(false)
        }
        return
      }

      // Cold miss or explicit refresh
      if (mode === 'swr' || mode === 'force') {
        setLoading(!cached)
        if (cached) {
          setDocument(cached.doc)
          setRefreshing(true)
        }
      } else {
        setLoading(true)
        setRefreshing(false)
      }
      setError(null)

      try {
        const doc = await buildSpecPackPreviewDocument(workspaceId, pack, {
          force: mode !== 'swr',
          bypassEntityCache: mode === 'hard',
        })
        if (seq !== requestSeq.current) return
        setDocument(doc)
      } catch (err) {
        if (seq !== requestSeq.current) return
        if (!cached) {
          setDocument(null)
          setError(err instanceof Error ? err.message : 'Failed to build preview')
        }
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- packKey tracks pack identity
    [workspaceId, packKey]
  )

  useEffect(() => {
    void load('swr')
  }, [load])

  return {
    document,
    loading,
    refreshing,
    error,
    refetch: () => load('force'),
    hardRefresh: () => load('hard'),
  }
}
