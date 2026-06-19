import { DOCUMENT_TYPE_LABEL, type DocumentType } from '@/modules/documents/document'

export function getEvidenceDocumentTypeLabel(documentType: string) {
  return DOCUMENT_TYPE_LABEL[documentType as DocumentType] ?? documentType
}
