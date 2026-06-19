import { DOCUMENT_ENDPOINTS } from '../../document/api/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { sessionsApi } from '@/modules/sessions'
import { requirementsApi } from '@/modules/projects'
import type { TraceLinksListResponse } from '@/modules/projects/traceability'
import type {
  DocumentLink,
  DocumentLinkedEntityType,
  DocumentRelationType,
  LinkedDocumentForEntity,
} from '../model/document-link-types'
import type { TargetOption } from '../model/document-links'

export interface BulkDocumentLinkResult {
  created_count: number
  skipped_duplicate_count: number
  failed_count: number
  created_links: DocumentLink[]
  skipped_documents: string[]
}

export async function listDocumentLinks(
  orgId: string,
  documentId: string,
  projectId?: string,
  includeArchived?: boolean
): Promise<{ items: DocumentLink[]; page?: { limit: number; offset: number; total: number } }> {
  const base = DOCUMENT_ENDPOINTS.listLinks(orgId, documentId, projectId)
  if (includeArchived) {
    const sep = base.includes('?') ? '&' : '?'
    return apiClient.get(`${base}${sep}include_archived=true`)
  }
  return apiClient.get(base)
}

export async function createDocumentLink(
  orgId: string,
  documentId: string,
  body: {
    linked_entity_type: DocumentLinkedEntityType
    linked_entity_id: string
    relation_type: DocumentRelationType
    project_id: string
    session_id?: string
    title_snapshot?: string
  }
): Promise<DocumentLink> {
  return apiClient.post(DOCUMENT_ENDPOINTS.createLink(orgId, documentId), body)
}

export async function archiveDocumentLink(
  orgId: string,
  documentId: string,
  linkId: string,
  projectId?: string
): Promise<DocumentLink> {
  return apiClient.post(DOCUMENT_ENDPOINTS.archiveLink(orgId, documentId, linkId, projectId), {})
}

export async function restoreDocumentLink(
  orgId: string,
  documentId: string,
  linkId: string,
  projectId?: string
): Promise<DocumentLink> {
  return apiClient.post(DOCUMENT_ENDPOINTS.restoreLink(orgId, documentId, linkId, projectId), {})
}

export async function getDocumentLinkCounts(
  orgId: string,
  documentIds: string[]
): Promise<{ counts: Record<string, number> }> {
  if (documentIds.length === 0) return { counts: {} }
  return apiClient.get(DOCUMENT_ENDPOINTS.linkCounts(orgId, documentIds))
}

export async function listLinkedDocumentsForEntity(
  orgId: string,
  params: {
    linked_entity_type: DocumentLinkedEntityType
    linked_entity_id: string
    project_id: string
    session_id?: string
    relation_type?: DocumentRelationType
    document_status?: 'active' | 'archived'
    workflow_status?: string
    include_archived_links?: boolean
  }
): Promise<{
  items: LinkedDocumentForEntity[]
  page: { limit: number; offset: number; total: number }
}> {
  return apiClient.get(DOCUMENT_ENDPOINTS.byEntity(orgId, params))
}

export async function bulkCreateDocumentLinks(
  orgId: string,
  body: {
    project_id: string
    linked_entity_type: DocumentLinkedEntityType
    linked_entity_id: string
    session_id?: string
    relation_type: DocumentRelationType
    document_ids: string[]
  }
): Promise<BulkDocumentLinkResult> {
  return apiClient.post(DOCUMENT_ENDPOINTS.bulkCreate(orgId), body)
}

export async function getEntityLinkCounts(
  orgId: string,
  params: {
    linked_entity_type: DocumentLinkedEntityType
    project_id: string
    session_id?: string
    linked_entity_ids: string[]
  }
): Promise<{ counts: Record<string, number> }> {
  if (params.linked_entity_ids.length === 0) return { counts: {} }
  return apiClient.get(DOCUMENT_ENDPOINTS.entityLinkCounts(orgId, params))
}

async function listTraceLinks(orgId: string, projectId: string): Promise<TraceLinksListResponse> {
  return apiClient.get<TraceLinksListResponse>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/trace-links`
  )
}

export async function listSessionTargets(
  orgId: string,
  projectId: string
): Promise<TargetOption[]> {
  const res = await sessionsApi.listSessions(orgId, projectId, { limit: 100 })
  return res.items.map((s) => ({ value: s.id, label: s.name }))
}

export async function listRequirementTargets(
  orgId: string,
  projectId: string
): Promise<TargetOption[]> {
  const res = await requirementsApi.listRequirements(orgId, projectId, { limit: 200 })
  return res.items.map((r) => ({
    value: r.id,
    label: `${r.code} — ${r.title}`,
  }))
}

export async function listTraceItemTargets(
  orgId: string,
  projectId: string
): Promise<TargetOption[]> {
  const res = await listTraceLinks(orgId, projectId)
  return res.items.map((t) => ({
    value: t.id,
    label: `${t.link_type}: ${t.from_type} → ${t.to_type}`,
  }))
}

export async function listAnswerTargets(
  orgId: string,
  projectId: string,
  sessionId: string
): Promise<TargetOption[]> {
  const detail = await sessionsApi.getSession(orgId, projectId, sessionId)
  const questionMap = new Map((detail.questions ?? []).map((q) => [q.id, q.prompt]))

  return (detail.answers ?? [])
    .filter((a) => a.answer_status === 'answered')
    .map((a) => ({
      value: a.question_id,
      label: questionMap.get(a.question_id) ?? a.question_id,
      sessionId,
    }))
}
