'use client'

import { Modal, Typography, Button, ContentLoader } from '@/shared/ui'
import { DocumentTypeBadge } from './DocumentTypeBadge'
import type { AttachDocumentModalViewProps } from '../model/attach-document-modal'

export function AttachDocumentModalView({
  open,
  onClose,
  loading,
  documents,
  attachingId,
  onAttach,
}: AttachDocumentModalViewProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attach existing document"
      size="lg"
      actions={[{ label: 'Close', onClick: onClose, variant: 'ghost' }]}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <ContentLoader variant="easeOut" className="w-16" />
        </div>
      ) : documents.length === 0 ? (
        <Typography tone="muted" className="py-6 text-center">
          No available documents to attach.
        </Typography>
      ) : (
        <>
          <Typography variant="small" tone="muted" className="mb-3">
            Link a workspace document to this project. The original document is not copied.
          </Typography>
          <ul className="max-h-80 divide-y divide-neutral-200 overflow-y-auto">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Typography weight="medium">{doc.title}</Typography>
                  <div className="mt-1">
                    <DocumentTypeBadge type={doc.documentType} />
                  </div>
                  {doc.textSnippet && (
                    <Typography variant="small" tone="muted" className="mt-1 line-clamp-1">
                      {doc.textSnippet}
                    </Typography>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  loading={attachingId === doc.id}
                  onClick={() => onAttach(doc.id)}
                >
                  Attach
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}
