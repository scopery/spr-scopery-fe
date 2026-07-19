'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { DocumentContentGateway } from '../api/document-content.gateway'
import type { DocumentRevisionListItem } from '../model/document-content'

export function useDocumentRevisionHistory(
  projectId: string,
  documentId: string,
  onRestored?: () => void
) {
  const [items, setItems] = useState<DocumentRevisionListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoringNo, setRestoringNo] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !documentId) return
    setLoading(true)
    setError(null)
    try {
      const res = await DocumentContentGateway.listVersions(projectId, documentId, {
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [projectId, documentId])

  useEffect(() => {
    void load()
  }, [load])

  const restore = useCallback(
    async (revisionNo: number) => {
      setRestoringNo(revisionNo)
      try {
        await DocumentContentGateway.restoreVersion(projectId, documentId, revisionNo)
        toast.success(`Restored to revision ${revisionNo}`)
        await load()
        onRestored?.()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setRestoringNo(null)
      }
    },
    [projectId, documentId, load, onRestored]
  )

  return { items, loading, error, restoringNo, restore, refetch: load }
}
