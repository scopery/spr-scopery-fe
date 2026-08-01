'use client'

import { useCreateDocumentModal } from '../hooks/useCreateDocumentModal'
import type { CreateDocumentModalProps } from '../model/create-document-modal'
import { CreateDocumentModalView } from './CreateDocumentModalView'

export function CreateDocumentModal(props: CreateDocumentModalProps) {
  const modal = useCreateDocumentModal(props)

  return (
    <CreateDocumentModalView
      {...props}
      title={modal.title}
      documentType={modal.documentType}
      visibility={modal.visibility}
      loading={modal.loading}
      onTitleChange={modal.setTitle}
      onDocumentTypeChange={modal.setDocumentType}
      onVisibilityChange={modal.setVisibility}
      onSubmit={(event) => void modal.handleSubmit(event)}
    />
  )
}
