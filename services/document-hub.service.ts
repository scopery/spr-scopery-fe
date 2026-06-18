import { DOCUMENT_HUB_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { DocumentOriginType, DocumentType, DocumentWorkflowStatus } from '@/types/document'

export interface DocumentHubItem {
  id: string
  title: string
  document_type: DocumentType
  origin_type: DocumentOriginType
  generated_by_ai: boolean
  status: 'active' | 'archived'
  workflow_status: DocumentWorkflowStatus
  created_by: string | null
  creator_display_name: string | null
  created_at: string
  updated_at: string
  project_id: string | null
  project_name: string | null
  section_id: string | null
  section_name: string | null
  snippet: string
  link_count?: number
}

export interface DocumentHubResponse {
  items: DocumentHubItem[]
  page: { limit: number; offset: number; total: number }
}

export async function listDocumentHubDocuments(
  orgId: string,
  params?: {
    project_id?: string
    search?: string
    document_type?: DocumentType
    origin_type?: string
    generated_by_ai?: boolean
    section_id?: string
    status?: 'active' | 'archived'
    workflow_status?: DocumentWorkflowStatus
    sort?: 'updated_at' | 'created_at' | 'title' | 'project'
    limit?: number
    offset?: number
  }
): Promise<DocumentHubResponse> {
  return apiClient.get<DocumentHubResponse>(DOCUMENT_HUB_ENDPOINTS.list(orgId, params))
}
