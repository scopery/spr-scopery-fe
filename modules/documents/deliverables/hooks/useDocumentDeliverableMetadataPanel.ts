'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DocumentDeliverableMetadata } from '../model/document-deliverable-types'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as deliverablesApi from '../api/deliverables.api'

interface UseDocumentDeliverableMetadataPanelParams {
  orgId: string
  documentId: string
  projectId?: string
  canRefresh: boolean
}

export function useDocumentDeliverableMetadataPanel({
  orgId,
  documentId,
  projectId,
  canRefresh,
}: UseDocumentDeliverableMetadataPanelParams) {
  const [metadata, setMetadata] = useState<DocumentDeliverableMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showWarnings, setShowWarnings] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await deliverablesApi.getDocumentDeliverableMetadata(
        orgId,
        documentId,
        projectId
      )
      setMetadata(data)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load deliverable metadata')
    } finally {
      setLoading(false)
    }
  }, [orgId, documentId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const handleRefresh = useCallback(async () => {
    if (!canRefresh) return
    setRefreshing(true)
    try {
      const result = await deliverablesApi.refreshDocumentDeliverableReadiness(
        orgId,
        documentId,
        projectId
      )
      setMetadata((prev) =>
        prev
          ? {
              ...prev,
              readiness: result.readiness,
            }
          : prev
      )
      setShowWarnings(true)
      toast.success('Readiness refreshed')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to refresh readiness')
    } finally {
      setRefreshing(false)
    }
  }, [canRefresh, orgId, documentId, projectId])

  const readiness = metadata?.readiness
  const hasWarningDetails = Boolean(
    readiness && (readiness.warnings.length > 0 || readiness.blocking_issues.length > 0)
  )

  return {
    metadata,
    loading,
    refreshing,
    showWarnings,
    hasWarningDetails,
    toggleWarnings: () => setShowWarnings((v) => !v),
    handleRefresh,
  }
}
