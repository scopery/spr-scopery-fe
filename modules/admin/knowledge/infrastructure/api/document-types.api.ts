import { apiClient } from '@/shared/lib/apiClient'
import { DOCUMENT_TYPE_ENDPOINTS } from './endpoints'
import type {
  DocumentType,
  CreateSystemDocumentTypePayload,
  CreateWorkspaceDocumentTypePayload,
  UpdateDocumentTypePayload,
  SearchDocumentTypesParams,
} from '../../domain/model/document-type'

export interface DocumentTypePageResponse {
  items: DocumentType[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export async function createSystemDocumentType(
  body: CreateSystemDocumentTypePayload
): Promise<DocumentType> {
  return apiClient.post<DocumentType>(DOCUMENT_TYPE_ENDPOINTS.createSystem(), body)
}

export async function createWorkspaceDocumentType(
  body: CreateWorkspaceDocumentTypePayload
): Promise<DocumentType> {
  return apiClient.post<DocumentType>(DOCUMENT_TYPE_ENDPOINTS.createWorkspace(), body)
}

export async function getDocumentType(id: string): Promise<DocumentType> {
  return apiClient.get<DocumentType>(DOCUMENT_TYPE_ENDPOINTS.get(id))
}

export async function searchDocumentTypes(
  params?: SearchDocumentTypesParams
): Promise<DocumentTypePageResponse> {
  return apiClient.get<DocumentTypePageResponse>(DOCUMENT_TYPE_ENDPOINTS.search(params))
}

export async function updateDocumentType(
  id: string,
  body: UpdateDocumentTypePayload
): Promise<DocumentType> {
  return apiClient.put<DocumentType>(DOCUMENT_TYPE_ENDPOINTS.update(id), body)
}

export async function activateDocumentType(id: string): Promise<DocumentType> {
  return apiClient.patch<DocumentType>(DOCUMENT_TYPE_ENDPOINTS.activate(id))
}

export async function deactivateDocumentType(id: string): Promise<DocumentType> {
  return apiClient.patch<DocumentType>(DOCUMENT_TYPE_ENDPOINTS.deactivate(id))
}

export async function softDeleteDocumentType(id: string): Promise<DocumentType> {
  return apiClient.patch<DocumentType>(DOCUMENT_TYPE_ENDPOINTS.softDelete(id))
}
