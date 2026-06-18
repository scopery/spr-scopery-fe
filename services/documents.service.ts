/**
 * Documents service — v2 API
 */

import { DOCUMENT_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  Document,
  DocumentType,
  DocumentVisibility,
  DocumentWorkflowStatus,
  PaginatedResponse,
  PlainDocumentContent,
  ProjectDocumentListItem,
} from '@/types/document'

export async function listProjectDocuments(
  orgId: string,
  projectId: string,
  params?: {
    q?: string
    document_type?: DocumentType
    pinned_only?: boolean
    status?: 'active' | 'archived'
    workflow_status?: DocumentWorkflowStatus
    limit?: number
    offset?: number
  }
): Promise<PaginatedResponse<ProjectDocumentListItem>> {
  return apiClient.get<PaginatedResponse<ProjectDocumentListItem>>(
    DOCUMENT_ENDPOINTS.listProject(orgId, projectId, params)
  )
}

export async function listWorkspaceDocuments(
  orgId: string,
  params?: { q?: string; exclude_project_id?: string; limit?: number; offset?: number }
): Promise<PaginatedResponse<Document>> {
  return apiClient.get<PaginatedResponse<Document>>(DOCUMENT_ENDPOINTS.listOrg(orgId, params))
}

export async function getDocument(orgId: string, documentId: string): Promise<Document> {
  return apiClient.get<Document>(DOCUMENT_ENDPOINTS.get(orgId, documentId))
}

export async function createProjectDocument(
  orgId: string,
  projectId: string,
  body: {
    title: string
    content?: PlainDocumentContent | { format: 'plate'; value: unknown[] }
    document_type?: DocumentType
    visibility?: DocumentVisibility
    section_id?: string | null
  }
): Promise<Document> {
  return apiClient.post<Document>(DOCUMENT_ENDPOINTS.createProject(orgId, projectId), body)
}

export async function updateDocument(
  orgId: string,
  documentId: string,
  body: {
    title?: string
    content?: PlainDocumentContent | { format: 'plate'; value: unknown[] }
    document_type?: DocumentType
    visibility?: DocumentVisibility
    workflow_status?: DocumentWorkflowStatus
  },
  projectId?: string
): Promise<Document> {
  return apiClient.patch<Document>(DOCUMENT_ENDPOINTS.update(orgId, documentId, projectId), body)
}

export async function archiveDocument(
  orgId: string,
  documentId: string,
  projectId?: string
): Promise<Document> {
  return apiClient.post<Document>(DOCUMENT_ENDPOINTS.archive(orgId, documentId, projectId), {})
}

export async function restoreDocument(
  orgId: string,
  documentId: string,
  projectId?: string
): Promise<Document> {
  return apiClient.post<Document>(DOCUMENT_ENDPOINTS.restore(orgId, documentId, projectId), {})
}

export async function attachDocumentToProject(
  orgId: string,
  projectId: string,
  documentId: string,
  sectionId?: string | null
): Promise<{ link_id: string }> {
  return apiClient.post<{ link_id: string }>(DOCUMENT_ENDPOINTS.attach(orgId, projectId), {
    document_id: documentId,
    section_id: sectionId ?? null,
  })
}

export async function detachDocumentFromProject(
  orgId: string,
  projectId: string,
  documentId: string
): Promise<{ detached: boolean }> {
  return apiClient.delete<{ detached: boolean }>(
    DOCUMENT_ENDPOINTS.detach(orgId, projectId, documentId)
  )
}

export async function pinProjectDocument(
  orgId: string,
  projectId: string,
  documentId: string,
  pinned: boolean
): Promise<{ pinned: boolean }> {
  return apiClient.patch<{ pinned: boolean }>(DOCUMENT_ENDPOINTS.pin(orgId, projectId, documentId), {
    pinned,
  })
}

export async function downloadSingleDocumentExport(
  _orgId: string,
  _documentId: string,
  _opts?: { format?: string; project_id?: string }
): Promise<void> {
  // TODO: implement document export download
}
