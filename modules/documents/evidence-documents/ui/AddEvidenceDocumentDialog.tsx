'use client'

import { Modal, Select, Typography } from '@/shared/ui'
import {
  DOCUMENT_RELATION_OPTIONS,
  type DocumentRelationType,
} from '@/modules/documents/document-links'
import { useAddEvidenceDocumentDialog } from '../hooks/useAddEvidenceDocumentDialog'
import type { AddEvidenceDocumentDialogProps } from '../model/evidence-documents'

export function AddEvidenceDocumentDialog(props: AddEvidenceDocumentDialogProps) {
  const dialog = useAddEvidenceDocumentDialog(props)

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title="Link evidence document"
      size="md"
      actions={[
        { label: 'Cancel', onClick: props.onClose, variant: 'ghost' },
        {
          label: 'Link document',
          onClick: () => void dialog.handleSubmit(),
          variant: 'primary',
          loading: dialog.loading,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Attach an existing project document as evidence for this{' '}
          {props.linkedEntityType.replace('_', ' ')}.
        </Typography>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Relation
          </Typography>
          <Select
            value={dialog.relationType}
            onValueChange={(v: string) => dialog.setRelationType(v as DocumentRelationType)}
            options={DOCUMENT_RELATION_OPTIONS}
          />
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Document
          </Typography>
          <Select
            value={dialog.documentId}
            onValueChange={dialog.setDocumentId}
            options={dialog.documentOptions}
            placeholder={dialog.loadingDocs ? 'Loading documents…' : 'Select document'}
          />
        </div>
      </div>
    </Modal>
  )
}
