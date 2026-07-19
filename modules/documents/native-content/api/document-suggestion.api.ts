import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { DOCUMENT_SUGGESTION_ENDPOINTS } from './endpoints'
import type { DocumentSuggestion } from '../model/collaboration'

export async function listSuggestions(
  projectId: string,
  documentId: string
): Promise<{ items: DocumentSuggestion[] }> {
  const res = await apiClient.get<ListPayload<DocumentSuggestion>>(DOCUMENT_SUGGESTION_ENDPOINTS.list(projectId, documentId))
  return normalizeItemList(res)
}

export async function acceptSuggestion(
  projectId: string,
  documentId: string,
  suggestionId: string
): Promise<DocumentSuggestion> {
  return apiClient.post(
    DOCUMENT_SUGGESTION_ENDPOINTS.accept(projectId, documentId, suggestionId),
    {},
    { skipErrorToast: true }
  )
}

export async function rejectSuggestion(
  projectId: string,
  documentId: string,
  suggestionId: string
): Promise<DocumentSuggestion> {
  return apiClient.post(
    DOCUMENT_SUGGESTION_ENDPOINTS.reject(projectId, documentId, suggestionId),
    {}
  )
}
