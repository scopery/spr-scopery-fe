import type { DocumentType, DocumentVisibility } from '../model/document'

export interface CreateDocumentModalProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: (documentId: string) => void
  sectionId?: string | null
}

export interface CreateDocumentModalViewProps extends CreateDocumentModalProps {
  title: string
  documentType: DocumentType
  visibility: DocumentVisibility
  loading: boolean
  onTitleChange: (title: string) => void
  onDocumentTypeChange: (documentType: DocumentType) => void
  onVisibilityChange: (visibility: DocumentVisibility) => void
  onSubmit: (event: React.FormEvent) => void
}

export interface EmptyDocumentsStateProps {
  canCreate: boolean
  onCreate: () => void
}
