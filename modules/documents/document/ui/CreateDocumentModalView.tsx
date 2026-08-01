'use client'

import { Modal, Input, Select, Typography } from '@/shared/ui'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_VISIBILITY_OPTIONS,
  type DocumentType,
  type DocumentVisibility,
} from '@/modules/documents/document'
import type { CreateDocumentModalViewProps } from '../model/create-document-modal'

export function CreateDocumentModalView({
  open,
  onClose,
  title,
  documentType,
  visibility,
  loading,
  onTitleChange,
  onDocumentTypeChange,
  onVisibilityChange,
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
          Create a blank document.
        </Typography>

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
