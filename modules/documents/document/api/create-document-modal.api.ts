import type { Document, DocumentType, DocumentVisibility } from '../model/document'
import type { CreateDocumentFromTemplateInput } from '@/modules/documents/document-templates'
import { createProjectDocument } from './documents.api'
import {
  createDocumentFromTemplateInProject,
  previewTemplateVariables,
} from '@/modules/documents/document-templates/api/document-templates.api'

export { previewTemplateVariables, createDocumentFromTemplateInProject }

export async function createBlankProjectDocument(
  orgId: string,
  projectId: string,
  body: {
    title: string
    document_type: DocumentType
    visibility: DocumentVisibility
    section_id: string | null
  }
): Promise<Document> {
  return createProjectDocument(orgId, projectId, {
    ...body,
    content: { format: 'plate' as const, value: [{ type: 'p', children: [{ text: '' }] }] },
  })
}
