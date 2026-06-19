'use client'

import { Modal, Typography, Button } from '@/shared/ui'
import { DocumentReadOnlyRenderer } from '@/modules/documents/document/ui/editor/DocumentReadOnlyRenderer'
import type { DocumentTemplate } from '../model/document-templates'
import { DocumentTypeBadge } from '@/modules/documents/document/ui/DocumentTypeBadge'
import { TemplateCategoryBadge } from './TemplateCategoryBadge'
import { TemplateScopeBadge } from './TemplateScopeBadge'
import { TemplateStatusBadge } from './TemplateStatusBadge'
import { TemplateVariableWarnings } from './TemplateVariableWarnings'
import { useTemplatePreviewDialog } from '../hooks/useTemplatePreviewDialog'

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
  const preview = useTemplatePreviewDialog({ template, open, orgId, projectId })

  if (!template) return null

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
              variant={preview.previewMode === 'raw' ? 'primary' : 'outline'}
              onClick={() => preview.setPreviewMode('raw')}
            >
              Raw template
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preview.previewMode === 'resolved' ? 'primary' : 'outline'}
              onClick={() => preview.setPreviewMode('resolved')}
              loading={preview.loadingResolved}
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
          <Typography weight="semibold">{preview.previewTitle}</Typography>
          {template.description && (
            <Typography variant="small" tone="muted" className="mt-1">
              {template.description}
            </Typography>
          )}
        </div>

        {preview.previewMode === 'resolved' && preview.resolvedPreview && (
          <TemplateVariableWarnings
            unknownVariables={preview.resolvedPreview.unresolved_variables}
            warnings={preview.resolvedPreview.warnings}
          />
        )}

        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <DocumentReadOnlyRenderer content={preview.previewContent} />
        </div>
      </div>
    </Modal>
  )
}
