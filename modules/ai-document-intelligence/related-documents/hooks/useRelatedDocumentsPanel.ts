'use client'

import { useEffect, useState } from 'react'
import * as aiDocumentIntelligenceApi from '@/modules/ai-document-intelligence/document-ai/api/ai-document-intelligence.api'
import type { RelatedDocumentItem } from '@/modules/ai-document-intelligence/document-ai/model/ai-document-intelligence'

interface UseRelatedDocumentsPanelParams {
  orgId: string
  documentId: string
  projectId?: string
  enabled: boolean
}

export function useRelatedDocumentsPanel({
  orgId,
  documentId,
  projectId,
  enabled,
}: UseRelatedDocumentsPanelParams) {
  const [items, setItems] = useState<RelatedDocumentItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    aiDocumentIntelligenceApi
      .findRelatedDocuments(orgId, documentId, { project_id: projectId, limit: 8 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [enabled, orgId, documentId, projectId])

  return { items, loading }
}
