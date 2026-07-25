import type { Document, DocumentType, DocumentVisibility } from '../model/document'
import { toBeDocumentTypeCode } from '../model/document-type-codes'
import { createProjectDocument as createWorkbenchDocument } from '@/modules/documents/document-hub/api/document-workbench.api'
import {
  createDocumentFromTemplateInProject,
  previewTemplateVariables,
} from '@/modules/documents/document-templates/api/document-templates.api'

export { previewTemplateVariables, createDocumentFromTemplateInProject }

/**
 * Hub "New document" → Wave 4.1 NATIVE doc (editable in Plate).
 * BE defaults to FILE when contentMode is omitted — that cannot use /content.
 */
export async function createBlankProjectDocument(
  _orgId: string,
  projectId: string,
  body: {
    title: string
    document_type: DocumentType
    visibility: DocumentVisibility
    section_id: string | null
  }
): Promise<Document> {
  const created = await createWorkbenchDocument(projectId, {
    title: body.title,
    documentTypeCode: toBeDocumentTypeCode(body.document_type),
    contentMode: 'NATIVE',
  })
  return {
    id: created.id,
    org_id: _orgId,
    title: created.title,
    content: { format: 'plate', value: [{ type: 'p', children: [{ text: '' }] }] },
    plain_text: '',
    document_type: body.document_type,
    visibility: body.visibility,
    status: 'active',
    workflow_status: 'draft',
    origin_type: 'manual',
    origin_id: null,
    created_by: null,
    updated_by: null,
    created_at: created.createdAt ?? '',
    updated_at: created.createdAt ?? '',
  }
}
