import { DOCUMENT_HUB_ENDPOINTS } from './endpoints'
import { projectsApi } from '@/modules/projects'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  DocumentOriginType,
  DocumentType,
  DocumentWorkflowStatus,
} from '@/modules/documents/document'
import { restoreDocument } from '@/modules/documents/document/api/documents.api'
import {
  exportDocumentHub,
  formatExportSize,
  previewDocumentHubExport,
  type DocumentHubExportPreviewResult,
} from '@/modules/documents/document-export/api/document-export.api'
import {
  getHubDeliverableContext,
  resolveHubDeliverableSelection,
} from '@/modules/documents/deliverables/api/deliverables.api'

export type { DocumentHubExportPreviewResult }
export type { ProjectListItem } from '@/modules/projects'

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

export function listProjects(orgId: string) {
  return projectsApi.listProjects(orgId, { limit: 100 })
}

export async function listDocumentHubDocuments(
  orgId: string,
  params: {
    project_id?: string
    search?: string
    document_type?: DocumentType
    origin_type?: string
    generated_by_ai?: boolean
    status: 'active' | 'archived'
    workflow_status?: DocumentWorkflowStatus
    sort: 'updated_at'
    limit: number
  }
): Promise<DocumentHubResponse> {
  return apiClient.get<DocumentHubResponse>(DOCUMENT_HUB_ENDPOINTS.list(orgId, params))
}

export { exportDocumentHub, previewDocumentHubExport, formatExportSize }
export { resolveHubDeliverableSelection, getHubDeliverableContext, restoreDocument }
