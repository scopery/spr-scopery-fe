'use client'

import { Modal, Select, Typography, Input } from '@/shared/ui'
import {
  DOCUMENT_RELATION_OPTIONS,
  type DocumentRelationType,
} from '@/modules/documents/document-links'
import { getEvidenceDocumentTypeLabel } from '../lib/evidence-document-labels'
import { useBulkLinkEvidenceDocumentsDialog } from '../hooks/useBulkLinkEvidenceDocumentsDialog'
import type { BulkLinkEvidenceDocumentsDialogProps } from '../model/evidence-documents'

export function BulkLinkEvidenceDocumentsDialog(props: BulkLinkEvidenceDocumentsDialogProps) {
  const dialog = useBulkLinkEvidenceDocumentsDialog(props)
  const selectedCount = dialog.selectedIds.size

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title="Link multiple documents"
      size="md"
      actions={[
        { label: 'Cancel', onClick: props.onClose, variant: 'ghost' },
        {
          label:
            selectedCount > 0
              ? `Link ${selectedCount} document${selectedCount === 1 ? '' : 's'}`
              : 'Link documents',
          onClick: () => void dialog.handleSubmit(),
          variant: 'primary',
          loading: dialog.loading,
          disabled: selectedCount === 0,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Select existing project documents to link as evidence for this{' '}
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
            Search documents
          </Typography>
          <Input
            placeholder={dialog.loadingDocs ? 'Loading documents…' : 'Search by title or type…'}
            value={dialog.search}
            onChange={(e) => dialog.setSearch(e.target.value)}
            fullWidth
          />
        </div>

        <div className="max-h-64 overflow-y-auto rounded border border-neutral-200">
          {dialog.loadingDocs ? (
            <Typography variant="small" tone="muted" className="p-4 text-center">
              Loading documents…
            </Typography>
          ) : dialog.filteredDocuments.length === 0 ? (
            <Typography variant="small" tone="muted" className="p-4 text-center">
              No active documents found in this project.
            </Typography>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {dialog.filteredDocuments.map((doc) => {
                const checked = dialog.selectedIds.has(doc.id)
                return (
                  <li key={doc.id}>
                    <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-neutral-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => dialog.toggleDocument(doc.id)}
                        className="mt-1"
                      />
                      <span className="min-w-0">
                        <Typography weight="medium" className="block truncate">
                          {doc.title}
                        </Typography>
                        <Typography variant="small" tone="muted">
                          {getEvidenceDocumentTypeLabel(doc.document_type)}
                        </Typography>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {selectedCount > 0 && (
          <Typography variant="small" tone="muted">
            {selectedCount} document{selectedCount === 1 ? '' : 's'} selected
          </Typography>
        )}
      </div>
    </Modal>
  )
}
