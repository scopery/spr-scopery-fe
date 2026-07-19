import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList } from '@/shared/lib/normalizeListResponse'
import { DOCUMENT_CONTENT_ENDPOINTS } from './endpoints'
import type {
  DocumentContentResponse,
  DocumentRevisionDetail,
  DocumentRevisionListItem,
  SaveDocumentContentRequest,
} from '../model/document-content'

export async function getDocumentContent(
  projectId: string,
  documentId: string
): Promise<DocumentContentResponse> {
  return apiClient.get<DocumentContentResponse>(
    DOCUMENT_CONTENT_ENDPOINTS.content(projectId, documentId)
  )
}

export async function saveDocumentContent(
  projectId: string,
  documentId: string,
  body: SaveDocumentContentRequest
): Promise<DocumentContentResponse> {
  return apiClient.put<DocumentContentResponse>(
    DOCUMENT_CONTENT_ENDPOINTS.content(projectId, documentId),
    body,
    { skipErrorToast: true }
  )
}

export async function listDocumentRevisions(
  projectId: string,
  documentId: string,
  params?: { page?: number; size?: number }
): Promise<{ items: DocumentRevisionListItem[]; total?: number }> {
  const res = await apiClient.get<
    DocumentRevisionListItem[] | { items?: DocumentRevisionListItem[]; totalElements?: number }
  >(DOCUMENT_CONTENT_ENDPOINTS.revisions(projectId, documentId, params))
  const { items } = normalizeItemList(res)
  const total =
    !Array.isArray(res) && typeof res?.totalElements === 'number'
      ? res.totalElements
      : items.length
  return { items, total }
}

export async function getDocumentRevision(
  projectId: string,
  documentId: string,
  revisionNo: number
): Promise<DocumentRevisionDetail> {
  return apiClient.get<DocumentRevisionDetail>(
    DOCUMENT_CONTENT_ENDPOINTS.revision(projectId, documentId, revisionNo)
  )
}

export async function restoreDocumentRevision(
  projectId: string,
  documentId: string,
  revisionNo: number
): Promise<DocumentContentResponse> {
  return apiClient.post<DocumentContentResponse>(
    DOCUMENT_CONTENT_ENDPOINTS.restoreRevision(projectId, documentId, revisionNo),
    {}
  )
}
