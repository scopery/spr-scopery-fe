'use client'

import { useCreateDocumentModal } from '../hooks/useCreateDocumentModal'
import type { CreateDocumentModalProps } from '../model/create-document-modal'
import { CreateDocumentModalView } from './CreateDocumentModalView'

export function CreateDocumentModal(props: CreateDocumentModalProps) {
  const modal = useCreateDocumentModal(props)

  return (
    <CreateDocumentModalView
      {...props}
      mode={modal.mode}
      title={modal.title}
      documentType={modal.documentType}
      visibility={modal.visibility}
      selectedTemplate={modal.selectedTemplate}
      loading={modal.loading}
      variablePreview={modal.variablePreview}
      previewLoading={modal.previewLoading}
      templateHasVariables={modal.templateHasVariables}
      onModeChange={modal.handleModeChange}
      onTitleChange={modal.setTitle}
      onDocumentTypeChange={modal.setDocumentType}
      onVisibilityChange={modal.setVisibility}
      onTemplateSelect={modal.setSelectedTemplate}
      onSubmit={(event) => void modal.handleSubmit(event)}
    />
  )
}
