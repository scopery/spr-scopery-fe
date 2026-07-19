'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { plateValueToAst } from '../model/ast-adapter'
import { emptyPlateValue } from '@/modules/documents/document/ui/editor/empty-plate-value'
import * as syncedApi from '../api/synced-block.api'
import type { SyncedBlock } from '../model/reusable-content'
import type { Value } from 'platejs'

export function useSyncedBlocks(workspaceId: string | null, projectId: string) {
  const [items, setItems] = useState<SyncedBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await syncedApi.listSyncedBlocks(workspaceId)
      setItems(res.items.filter((b) => b.status !== 'ARCHIVED'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load synced blocks')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const createFromAst = useCallback(
    async (ast: string, blockTitle: string) => {
      if (!workspaceId) return null
      setCreating(true)
      try {
        const created = await syncedApi.createSyncedBlock(workspaceId, projectId, {
          title: blockTitle,
          ast,
          schemaVersion: 1,
        })
        toast.success('Synced block created')
        setTitle('')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        return null
      } finally {
        setCreating(false)
      }
    },
    [workspaceId, projectId, load]
  )

  const createEmpty = useCallback(async () => {
    const t = title.trim() || 'Synced block'
    const value = emptyPlateValue() as Value
    return createFromAst(plateValueToAst(value), t)
  }, [title, createFromAst])

  const createFromEditorValue = useCallback(
    async (value: Value) => {
      const t = title.trim() || 'Synced block'
      return createFromAst(plateValueToAst(value), t)
    },
    [title, createFromAst]
  )

  const archive = useCallback(
    async (syncedBlockId: string) => {
      if (!workspaceId) return
      try {
        await syncedApi.archiveSyncedBlock(workspaceId, syncedBlockId)
        toast.success('Synced block archived')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      }
    },
    [workspaceId, load]
  )

  return {
    items,
    loading,
    error,
    title,
    setTitle,
    creating,
    createEmpty,
    createFromEditorValue,
    archive,
    refetch: load,
  }
}
