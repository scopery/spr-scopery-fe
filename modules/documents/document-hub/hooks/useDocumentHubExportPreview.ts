'use client'

import { useCallback, useEffect, useState } from 'react'
import * as documentHubApi from '../api/document-hub.api'
import type { DocumentHubExportPreviewResult } from '../model/document-hub'

interface UseDocumentHubExportPreviewParams {
  open: boolean
  orgId: string
  exportMode: 'selected' | 'filtered'
  documentIds: string[]
  buildPreviewBody: () => Parameters<typeof documentHubApi.previewDocumentHubExport>[1]
}

export function useDocumentHubExportPreview({
  open,
  orgId,
  exportMode,
  documentIds,
  buildPreviewBody,
}: UseDocumentHubExportPreviewParams) {
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<DocumentHubExportPreviewResult | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setPreview(null)
      setPreviewError(null)
      return
    }

    if (exportMode === 'selected' && documentIds.length === 0) {
      setPreview(null)
      return
    }

    const timer = setTimeout(() => {
      setPreviewLoading(true)
      setPreviewError(null)
      documentHubApi
        .previewDocumentHubExport(orgId, buildPreviewBody())
        .then((result) => setPreview(result))
        .catch((err: unknown) => {
          setPreview(null)
          setPreviewError(err instanceof Error ? err.message : 'Failed to load export preview')
        })
        .finally(() => setPreviewLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [open, orgId, buildPreviewBody, exportMode, documentIds.length])

  const formatExportSize = useCallback(
    (bytes: number) => documentHubApi.formatExportSize(bytes),
    []
  )

  return {
    preview,
    previewLoading,
    previewError,
    formatExportSize,
  }
}
