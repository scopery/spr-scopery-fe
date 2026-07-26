import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { KNOWLEDGE_ENDPOINTS } from './endpoints'
import type { DocumentType, DocumentTypeListResponse } from '../../domain/model/knowledge'

export async function listDocumentTypes(params?: {
  q?: string
}): Promise<DocumentTypeListResponse> {
  const res = await apiClient.get<ListPayload<DocumentType>>(KNOWLEDGE_ENDPOINTS.list(params))
  return normalizeItemList(res)
}

export async function getDocumentType(id: string): Promise<DocumentType> {
  return apiClient.get(KNOWLEDGE_ENDPOINTS.get(id))
}

export async function createWorkspaceDocumentType(body: {
  code: string
  name: string
  description?: string | null
}): Promise<DocumentType> {
  return apiClient.post<DocumentType>(KNOWLEDGE_ENDPOINTS.createWorkspace(), body)
}

export interface IndexJob {
  jobId?: string
  id?: string
  workspaceId?: string
  projectId?: string | null
  sourceId?: string | null
  jobType?: string
  jobStatus?: string
  status?: string
  processedCount?: number
  successCount?: number
  failureCount?: number
}

export async function listIndexingJobs(
  workspaceId: string
): Promise<{ items: IndexJob[] }> {
  const res = await apiClient.get<ListPayload<IndexJob>>(KNOWLEDGE_ENDPOINTS.indexingJobs(workspaceId))
  return normalizeItemList(res)
}

export async function startWorkspaceReindex(workspaceId: string): Promise<IndexJob> {
  return apiClient.post(KNOWLEDGE_ENDPOINTS.reindexWorkspace(workspaceId), {})
}

export async function startProjectReindex(projectId: string): Promise<IndexJob> {
  return apiClient.post(KNOWLEDGE_ENDPOINTS.reindexProject(projectId), {})
}

export async function getIndexingJob(jobId: string): Promise<IndexJob> {
  return apiClient.get(KNOWLEDGE_ENDPOINTS.indexingJob(jobId))
}

export async function listRelatedEntities(
  entityId: string
): Promise<{ items: Array<{ id: string; title: string; type: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; title: string; type: string }>>(KNOWLEDGE_ENDPOINTS.graphRelated(entityId))
  return normalizeItemList(res)
}

export async function listDocumentClassifications(): Promise<{
  items: Array<{ id: string; code?: string; name: string }>
}> {
  const res = await apiClient.get<ListPayload<{ id: string; code?: string; name: string }>>(KNOWLEDGE_ENDPOINTS.documentClassifications())
  return normalizeItemList(res)
}

export async function getKnowledgeSource(
  sourceId: string
): Promise<{ id: string; title?: string; status?: string }> {
  return apiClient.get(KNOWLEDGE_ENDPOINTS.source(sourceId))
}

export async function listSourceChunks(
  sourceId: string
): Promise<{ items: Array<{ id: string; text?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; text?: string }>>(KNOWLEDGE_ENDPOINTS.sourceChunks(sourceId, { page: 0, size: 20 }))
  return normalizeItemList(res)
}

export async function reindexKnowledgeSource(
  sourceId: string
): Promise<{ id: string; status: string }> {
  return apiClient.post(KNOWLEDGE_ENDPOINTS.reindexSource(sourceId), {})
}

export interface DocumentIndexStatus {
  documentId: string
  projectId: string
  indexed: boolean
  totalChunks: number
  embeddedChunks: number
  lastIndexedAt: string | null
}

export async function getDocumentIndexStatus(
  projectId: string,
  documentId: string
): Promise<DocumentIndexStatus> {
  return apiClient.get(KNOWLEDGE_ENDPOINTS.documentStatus(projectId, documentId))
}

export async function reindexDocument(
  projectId: string,
  documentId: string
): Promise<DocumentIndexStatus> {
  return apiClient.post(KNOWLEDGE_ENDPOINTS.reindexDocument(projectId, documentId), {})
}
