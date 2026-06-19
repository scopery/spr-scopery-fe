'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as aiDocumentIntelligenceApi from '../api/ai-document-intelligence.api'
import type {
  AIStructuredPreview,
  DocumentAIMetadata,
  DocumentAIPanelProps,
} from '../model/ai-document-intelligence'

export function useDocumentAIPanel({
  orgId,
  documentId,
  projectId,
  permissions,
}: Pick<
  DocumentAIPanelProps,
  'orgId' | 'documentId' | 'projectId' | 'permissions'
>) {
  const router = useRouter()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<AIStructuredPreview | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<DocumentAIMetadata | null>(null)

  const handleError = (err: unknown) => {
    const msg =
      err instanceof ApiError
        ? err.problem.detail
        : err instanceof Error
          ? err.message
          : 'AI action failed'
    toast.error(msg)
  }

  const summarize = async () => {
    setLoading(true)
    setPreviewOpen(true)
    setPreview(null)
    try {
      const res = await aiDocumentIntelligenceApi.summarizeDocument(orgId, documentId, {
        project_id: projectId,
        save: false,
      })
      if ('preview' in res) {
        setPreview(res.preview)
        setGenerationId(res.generationId)
        setWarnings(res.warnings ?? [])
      }
    } catch (err) {
      setPreviewOpen(false)
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const saveSummary = async () => {
    if (!preview || !generationId || !projectId) {
      toast.error('Open this document from a project to save the summary.')
      return
    }
    setLoading(true)
    try {
      const res = await aiDocumentIntelligenceApi.saveAIPreviewAsDocument(orgId, {
        generation_id: generationId,
        project_id: projectId,
        title: preview.title,
        sections: preview.sections,
        origin_type: 'document_summary',
        document_type: 'summary',
      })
      toast.success('Summary saved')
      setPreviewOpen(false)
      router.push(ROUTES.org.document(orgId, res.document.id, projectId))
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMetadata = () => {
    if (metadata || !permissions.canViewAIMetadata) return
    aiDocumentIntelligenceApi
      .getDocumentAIMetadata(orgId, documentId)
      .then(setMetadata)
      .catch(() => {})
  }

  return {
    previewOpen,
    preview,
    generationId,
    warnings,
    loading,
    metadata,
    setPreviewOpen,
    summarize,
    saveSummary,
    loadMetadata,
  }
}
