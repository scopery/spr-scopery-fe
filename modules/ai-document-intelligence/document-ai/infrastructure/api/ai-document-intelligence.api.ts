import { AI_DOCUMENT_ENDPOINTS } from './endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import type {
  AIStructuredSection,
  AIStructuredPreview,
  AIPreviewResponse,
  AIDocumentCreatedResponse,
  RelatedDocumentItem,
  DocumentAIMetadata,
} from '../../domain/model/ai-document-intelligence'

export type {
  AIStructuredSection,
  AIStructuredPreview,
  AIPreviewResponse,
  AIDocumentCreatedResponse,
  RelatedDocumentItem,
  DocumentAIMetadata,
}

export async function generateProjectBrief(
  orgId: string,
  projectId: string,
  body: {
    session_id?: string
    section_id?: string | null
    custom_instructions?: string
    save?: boolean
  }
): Promise<AIPreviewResponse | AIDocumentCreatedResponse> {
  return apiClient.post(AI_DOCUMENT_ENDPOINTS.projectBrief(orgId, projectId), body)
}

export async function summarizeProjectDocuments(
  orgId: string,
  projectId: string,
  body: { selected_document_ids?: string[]; section_id?: string | null; save?: boolean }
): Promise<AIPreviewResponse | AIDocumentCreatedResponse> {
  return apiClient.post(AI_DOCUMENT_ENDPOINTS.summarizeDocuments(orgId, projectId), body)
}

export async function saveQASummary(
  orgId: string,
  projectId: string,
  body: { session_id: string; section_id?: string | null; title?: string }
): Promise<AIDocumentCreatedResponse> {
  return apiClient.post(AI_DOCUMENT_ENDPOINTS.qaSummary(orgId, projectId), body)
}

export async function saveClarityReport(
  orgId: string,
  projectId: string,
  body: { session_id: string; section_id?: string | null; title?: string }
): Promise<AIDocumentCreatedResponse> {
  return apiClient.post(AI_DOCUMENT_ENDPOINTS.clarityReport(orgId, projectId), body)
}

export async function saveReadinessReport(
  orgId: string,
  projectId: string,
  body: { session_id: string; section_id?: string | null; title?: string }
): Promise<AIDocumentCreatedResponse> {
  return apiClient.post(AI_DOCUMENT_ENDPOINTS.readinessReport(orgId, projectId), body)
}

export async function summarizeDocument(
  orgId: string,
  documentId: string,
  body: { project_id?: string; section_id?: string | null; save?: boolean }
): Promise<AIPreviewResponse | AIDocumentCreatedResponse> {
  return apiClient.post(AI_DOCUMENT_ENDPOINTS.summarizeDocument(orgId, documentId), body)
}

export async function findRelatedDocuments(
  orgId: string,
  documentId: string,
  params?: { project_id?: string; limit?: number }
): Promise<{ items: RelatedDocumentItem[] }> {
  const res = await apiClient.get<ListPayload<RelatedDocumentItem>>(AI_DOCUMENT_ENDPOINTS.relatedDocuments(orgId, documentId, params))
  return normalizeItemList(res)
}

export async function getDocumentAIMetadata(
  orgId: string,
  documentId: string
): Promise<DocumentAIMetadata> {
  return apiClient.get(AI_DOCUMENT_ENDPOINTS.documentMetadata(orgId, documentId))
}

export async function saveAIPreviewAsDocument(
  orgId: string,
  body: {
    generation_id: string
    project_id: string
    section_id?: string | null
    title: string
    sections: AIStructuredSection[]
    document_type?: string
    origin_type?: string
  }
): Promise<{ document: { id: string; title: string } }> {
  return apiClient.post(AI_DOCUMENT_ENDPOINTS.savePreview(orgId), body)
}
