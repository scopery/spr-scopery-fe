'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DeliverableHistoryItem } from '../model/document-deliverable-types'
import { downloadSingleDocumentExport } from '@/utils/exportDownload'
import { toast } from 'sonner'
import * as deliverablesApi from '../api/deliverables.api'
import {
  toDocumentTypeFilterOptions,
  toWorkflowStatusFilterOptions,
} from '../api/deliverables.mapper'
import { DELIVERABLE_READINESS_FILTER_OPTIONS } from '../model/deliverables'

const PAGE_SIZE = 20

interface UseDeliverableHistoryPanelParams {
  orgId: string
  projectId: string
}

export function useDeliverableHistoryPanel({ orgId, projectId }: UseDeliverableHistoryPanelParams) {
  const [items, setItems] = useState<DeliverableHistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [workflowStatus, setWorkflowStatus] = useState('')
  const [readinessStatus, setReadinessStatus] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      try {
        const res = await deliverablesApi.listDeliverableHistory(orgId, projectId, {
          status: includeArchived ? 'archived' : 'active',
          document_type: documentType || undefined,
          workflow_status: workflowStatus || undefined,
          readiness_status: readinessStatus || undefined,
          limit: PAGE_SIZE,
          offset,
        })
        setTotal(res.total)
        setItems((prev) => (append ? [...prev, ...res.items] : res.items))
      } catch {
        toast.error('Failed to load deliverable history')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [orgId, projectId, documentType, workflowStatus, readinessStatus, includeArchived]
  )

  useEffect(() => {
    void loadPage(0, false)
  }, [loadPage])

  const handleExport = useCallback(
    async (documentId: string) => {
      setExportingId(documentId)
      try {
        await downloadSingleDocumentExport(orgId, documentId, {
          format: 'markdown',
          project_id: projectId,
        })
        toast.success('Document exported')
      } catch {
        toast.error('Export failed')
      } finally {
        setExportingId(null)
      }
    },
    [orgId, projectId]
  )

  return {
    items,
    total,
    loading,
    loadingMore,
    exportingId,
    documentType,
    workflowStatus,
    readinessStatus,
    includeArchived,
    documentTypeOptions: toDocumentTypeFilterOptions(),
    workflowStatusOptions: toWorkflowStatusFilterOptions(),
    readinessOptions: DELIVERABLE_READINESS_FILTER_OPTIONS,
    setDocumentType,
    setWorkflowStatus,
    setReadinessStatus,
    setIncludeArchived,
    loadMore: () => void loadPage(items.length, true),
    handleExport,
  }
}
