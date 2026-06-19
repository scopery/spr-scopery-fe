import type { DocumentType } from '../model/document'

export interface AttachDocumentModalProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
  sectionId?: string | null
}

export interface AttachDocumentListItem {
  id: string
  title: string
  documentType: DocumentType
  textSnippet: string | null
}

export interface AttachDocumentModalViewProps {
  open: boolean
  onClose: () => void
  loading: boolean
  documents: AttachDocumentListItem[]
  attachingId: string | null
  onAttach: (documentId: string) => void
}
