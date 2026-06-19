import type { Document } from '../model/document'
import { snippet } from '../model/document'
import type { AttachDocumentListItem } from '../model/attach-document-modal'

export function toAttachDocumentListItems(documents: Document[]): AttachDocumentListItem[] {
  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    documentType: doc.document_type,
    textSnippet: doc.plain_text ? snippet(doc.plain_text) : null,
  }))
}
