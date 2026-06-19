'use client'

import { Modal, Input, Select, Typography, Button } from '@/shared/ui'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_VISIBILITY_OPTIONS,
  type DocumentType,
  type DocumentVisibility,
} from '@/modules/documents/document'
import { TemplatePicker } from '@/modules/documents/document-templates/ui/TemplatePicker'
import { TemplateVariableWarnings } from '@/modules/documents/document-templates/ui/TemplateVariableWarnings'
import { cn } from '@/utils/cn'
import type { CreateDocumentModalViewProps } from '../model/create-document-modal'

export function CreateDocumentModalView({
  orgId,
  open,
  onClose,
  canCreateFromTemplate = true,
  mode,
  title,
  documentType,
  visibility,
  selectedTemplate,
  loading,
  variablePreview,
  previewLoading,
  templateHasVariables,
  onModeChange,
  onTitleChange,
  onDocumentTypeChange,
  onVisibilityChange,
  onTemplateSelect,
  onSubmit,
}: CreateDocumentModalViewProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New document"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Create', onClick: onSubmit, variant: 'primary', loading },
      ]}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Typography variant="small" tone="muted">
          Create a blank document{canCreateFromTemplate ? ' or start from a template' : ''}.
        </Typography>

        <div className="flex gap-2" role="group" aria-label="Creation mode">
          <Button
            type="button"
            variant={mode === 'blank' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onModeChange('blank')}
          >
            Blank document
          </Button>
          {canCreateFromTemplate && (
            <Button
              type="button"
              variant={mode === 'template' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onModeChange('template')}
            >
              From template
            </Button>
          )}
        </div>

        {mode === 'template' && (
          <div className={cn('border-t border-neutral-200 pt-4')}>
            <TemplatePicker
              orgId={orgId}
              selectedId={selectedTemplate?.id}
              onSelect={onTemplateSelect}
            />
          </div>
        )}

        {mode === 'template' && selectedTemplate && templateHasVariables && (
          <div className="space-y-2">
            <Typography variant="small" tone="muted">
              {previewLoading
                ? 'Checking template variables…'
                : 'Variables will be resolved using this project when the document is created.'}
            </Typography>
            {variablePreview && (
              <TemplateVariableWarnings
                unknownVariables={variablePreview.unresolved_variables}
                warnings={variablePreview.warnings}
              />
            )}
          </div>
        )}

        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Document title"
          fullWidth
        />

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Type
          </Typography>
          <Select
            value={documentType}
            onValueChange={(v: string) => onDocumentTypeChange(v as DocumentType)}
            options={DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Visibility
          </Typography>
          <Select
            value={visibility}
            onValueChange={(v: string) => onVisibilityChange(v as DocumentVisibility)}
            options={DOCUMENT_VISIBILITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
      </form>
    </Modal>
  )
}
