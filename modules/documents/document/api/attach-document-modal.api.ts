import type { Document } from '../model/document'
import {
  attachDocumentToProject,
  listWorkspaceDocuments as listWorkspaceDocumentsRaw,
} from './documents.api'

export async function listWorkspaceDocuments(
  orgId: string,
  projectId: string
): Promise<Document[]> {
  const res = await listWorkspaceDocumentsRaw(orgId, {
    exclude_project_id: projectId,
    limit: 50,
  })
  return res.items
}

export { attachDocumentToProject }
