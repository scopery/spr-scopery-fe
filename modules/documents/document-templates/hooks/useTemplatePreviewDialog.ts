'use client'

import { useEffect, useState } from 'react'
import * as documentTemplatesApi from '../api/document-templates.api'
import type { DocumentTemplate, TemplateVariablePreview } from '../model/document-templates'

type PreviewMode = 'raw' | 'resolved'

interface UseTemplatePreviewDialogParams {
  template: DocumentTemplate | null
  open: boolean
  orgId?: string
  projectId?: string
}

export function useTemplatePreviewDialog({
  template,
  open,
  orgId,
  projectId,
}: UseTemplatePreviewDialogParams) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('raw')
  const [resolvedPreview, setResolvedPreview] = useState<TemplateVariablePreview | null>(null)
  const [loadingResolved, setLoadingResolved] = useState(false)

  useEffect(() => {
    if (!open) {
      setPreviewMode('raw')
      setResolvedPreview(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !template || !orgId || previewMode !== 'resolved') {
      return
    }

    setLoadingResolved(true)
    void documentTemplatesApi
      .previewTemplateVariables(orgId, template.id, {
        project_id: projectId,
        document_title: template.title,
        mode: 'preview',
      })
      .then(setResolvedPreview)
      .catch(() => setResolvedPreview(null))
      .finally(() => setLoadingResolved(false))
  }, [open, template, orgId, projectId, previewMode])

  const previewContent =
    previewMode === 'resolved' && resolvedPreview
      ? resolvedPreview.resolved_content
      : (template?.content ?? { format: 'plate', value: [] })

  const previewTitle =
    previewMode === 'resolved' && resolvedPreview
      ? resolvedPreview.resolved_title
      : (template?.title ?? '')

  return {
    previewMode,
    setPreviewMode,
    resolvedPreview,
    loadingResolved,
    previewContent,
    previewTitle,
  }
}
