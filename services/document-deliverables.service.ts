/**
 * Document deliverables service — controlled template generation (no AI).
 */

import { DOCUMENT_ENDPOINTS } from '@/constants/endpoints'
import { DOCUMENT_HUB_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  CreateDeliverableResult,
  DeliverableEntryContext,
  DeliverableHistoryItem,
  DeliverablePickerItem,
  DeliverablePreviewResult,
  DeliverableReadinessWithMeta,
  DeliverableSourceEntityType,
  DeliverableTemplateListItem,
  DeliverableType,
  DocumentDeliverableMetadata,
  HubDeliverableContext,
  ResolveFilteredSelectionResult,
} from '@/types/document-deliverable'

export async function listDeliverableTemplates(
  orgId: string,
  projectId: string,
  params?: { deliverable_type?: DeliverableType; source_entity_type?: DeliverableSourceEntityType }
): Promise<{ items: DeliverableTemplateListItem[] }> {
  return apiClient.get<{ items: DeliverableTemplateListItem[] }>(
    DOCUMENT_ENDPOINTS.listDeliverableTemplates(orgId, projectId, params)
  )
}

export async function getHubDeliverableContext(
  orgId: string,
  selectedDocumentIds: string[]
): Promise<HubDeliverableContext> {
  return apiClient.get<HubDeliverableContext>(
    DOCUMENT_HUB_ENDPOINTS.deliverableContext(orgId, selectedDocumentIds)
  )
}

export async function getDeliverableContext(
  orgId: string,
  projectId: string
): Promise<{ counts: { sessions: number; requirements: number; project_documents: number } }> {
  return apiClient.get(DOCUMENT_ENDPOINTS.deliverableContext(orgId, projectId))
}

export async function previewDeliverable(
  orgId: string,
  projectId: string,
  body: {
    template_id?: string
    template_key?: string
    deliverable_type: DeliverableType
    source_entity_type?: DeliverableSourceEntityType
    source_entity_id?: string
    title?: string
    include_answer_content?: boolean
    include_archived_documents?: boolean
    selected_document_ids?: string[]
    entry_point?: DeliverableEntryContext
    options?: {
      include_evidence_index?: boolean
      include_linked_documents_summary?: boolean
    }
  }
): Promise<DeliverablePreviewResult> {
  return apiClient.post<DeliverablePreviewResult>(
    DOCUMENT_ENDPOINTS.previewDeliverable(orgId, projectId),
    body
  )
}

export async function createDeliverable(
  orgId: string,
  projectId: string,
  body: Parameters<typeof previewDeliverable>[2] & {
    attach_to_project?: boolean
    create_evidence_links?: boolean
  }
): Promise<CreateDeliverableResult> {
  return apiClient.post<CreateDeliverableResult>(
    DOCUMENT_ENDPOINTS.createDeliverable(orgId, projectId),
    body
  )
}

export async function searchDeliverablePickerDocuments(
  orgId: string,
  projectId: string,
  params?: {
    q?: string
    document_type?: string
    workflow_status?: string
    status?: 'active' | 'archived'
    limit?: number
    offset?: number
  }
): Promise<{ items: DeliverablePickerItem[]; total: number }> {
  return apiClient.get(DOCUMENT_ENDPOINTS.deliverablePicker(orgId, projectId, params))
}

export async function listDeliverableHistory(
  orgId: string,
  projectId: string,
  params?: {
    status?: 'active' | 'archived'
    document_type?: string
    workflow_status?: string
    readiness_status?: string
    limit?: number
    offset?: number
  }
): Promise<{ items: DeliverableHistoryItem[]; total: number }> {
  return apiClient.get(DOCUMENT_ENDPOINTS.deliverableHistory(orgId, projectId, params))
}

export async function getDocumentDeliverableMetadata(
  orgId: string,
  documentId: string,
  projectId?: string
): Promise<DocumentDeliverableMetadata> {
  return apiClient.get(DOCUMENT_ENDPOINTS.deliverableMetadata(orgId, documentId, projectId))
}

export async function refreshDocumentDeliverableReadiness(
  orgId: string,
  documentId: string,
  projectId?: string
): Promise<{ readiness: DeliverableReadinessWithMeta }> {
  return apiClient.post(DOCUMENT_ENDPOINTS.refreshDeliverableReadiness(orgId, documentId), {
    project_id: projectId,
  })
}

export async function resolveHubDeliverableSelection(
  orgId: string,
  filters: {
    project_id?: string
    search?: string
    document_type?: string
    origin_type?: string
    generated_by_ai?: boolean
    section_id?: string
    status?: 'active' | 'archived'
    workflow_status?: 'draft' | 'in_review' | 'approved'
  }
): Promise<ResolveFilteredSelectionResult> {
  return apiClient.post(DOCUMENT_HUB_ENDPOINTS.resolveDeliverableSelection(orgId), { filters })
}
