'use client'

import { useEffect, useState } from 'react'
import { Modal, Typography, Button } from '@/shared/ui'
import { DocumentReadOnlyRenderer } from '@/modules/documents/document/ui/editor/DocumentReadOnlyRenderer'
import * as documentTemplatesApi from '../api/document-templates.api'
import type { DocumentTemplate, TemplateVariablePreview } from '../model/document-templates'
import { DocumentTypeBadge } from '@/modules/documents/document/ui/DocumentTypeBadge'
import { TemplateCategoryBadge } from './TemplateCategoryBadge'
import { TemplateScopeBadge } from './TemplateScopeBadge'
import { TemplateStatusBadge } from './TemplateStatusBadge'
import { TemplateVariableWarnings } from './TemplateVariableWarnings'

type PreviewMode = 'raw' | 'resolved'

export interface TemplatePreviewDialogProps {
  template: DocumentTemplate | null
  open: boolean
  onClose: () => void
  orgId?: string
  projectId?: string
}

export function TemplatePreviewDialog({
  template,
  open,
  onClose,
  orgId,
  projectId,
}: TemplatePreviewDialogProps) {
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

  if (!template) return null

  const previewContent =
    previewMode === 'resolved' && resolvedPreview
      ? resolvedPreview.resolved_content
      : template.content

  const previewTitle =
    previewMode === 'resolved' && resolvedPreview ? resolvedPreview.resolved_title : template.title

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Template preview"
      size="lg"
      actions={[{ label: 'Close', onClick: onClose, variant: 'ghost' }]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Preview template content as raw tokens or with variables resolved using available context.
        </Typography>

        {orgId && (
          <div className="flex gap-2" role="group" aria-label="Preview mode">
            <Button
              type="button"
              size="sm"
              variant={previewMode === 'raw' ? 'primary' : 'outline'}
              onClick={() => setPreviewMode('raw')}
            >
              Raw template
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewMode === 'resolved' ? 'primary' : 'outline'}
              onClick={() => setPreviewMode('resolved')}
              loading={loadingResolved}
            >
              Resolved preview
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <TemplateScopeBadge scope={template.scope} />
          <TemplateStatusBadge status={template.status} isPublished={template.is_published} />
          <DocumentTypeBadge type={template.document_type} />
          <TemplateCategoryBadge category={template.category} />
        </div>

        <div>
          <Typography weight="semibold">{previewTitle}</Typography>
          {template.description && (
            <Typography variant="small" tone="muted" className="mt-1">
              {template.description}
            </Typography>
          )}
        </div>

        {previewMode === 'resolved' && resolvedPreview && (
          <TemplateVariableWarnings
            unknownVariables={resolvedPreview.unresolved_variables}
            warnings={resolvedPreview.warnings}
          />
        )}

        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <DocumentReadOnlyRenderer content={previewContent} />
        </div>
      </div>
    </Modal>
  )
}
