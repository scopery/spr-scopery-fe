'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as collaborationApi from '../api/collaboration.api'
import type { DocumentActivity } from '../model/collaboration'

interface UseDocumentActivityOptions {
  orgId: string
  documentId: string
  projectId?: string
  canViewActivity: boolean
  limit?: number
}

export function useDocumentActivity({
  orgId,
  documentId,
  projectId,
  canViewActivity,
  limit = 50,
}: UseDocumentActivityOptions) {
  const [items, setItems] = useState<DocumentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!canViewActivity) return
    setLoading(true)
    try {
      const res = await collaborationApi.listActivity(orgId, documentId, {
        project_id: projectId,
        limit,
      })
      setItems(res.items)
    } catch {
      toast.error('Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [orgId, documentId, projectId, canViewActivity, limit])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, load }
}
