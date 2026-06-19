'use client'

import { useAttachDocumentModal } from '../hooks/useAttachDocumentModal'
import type { AttachDocumentModalProps } from '../model/attach-document-modal'
import { AttachDocumentModalView } from './AttachDocumentModalView'

export function AttachDocumentModal({
  orgId,
  projectId,
  open,
  onClose,
  onSuccess,
  sectionId,
}: AttachDocumentModalProps) {
  const { documents, loading, attachingId, attach } = useAttachDocumentModal({
    orgId,
    projectId,
    open,
    sectionId,
    onSuccess,
    onClose,
  })

  return (
    <AttachDocumentModalView
      open={open}
      onClose={onClose}
      loading={loading}
      documents={documents}
      attachingId={attachingId}
      onAttach={(documentId) => void attach(documentId)}
    />
  )
}
