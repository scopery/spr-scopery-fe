import { DOCUMENT_ENDPOINTS } from '../../endpoints'
import { PROJECT_ENDPOINTS } from '@/modules/projects/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/shared/lib/api-types'
import { normalizeItemList, normalizeList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import * as sessionsApi from '@/modules/sessions/session/api/sessions.api'
import * as requirementsApi from '@/modules/projects/requirements/api/requirements.api'
import { listProjectDocuments } from '@/modules/documents/document-hub/api/document-workbench.api'
import { fromBeDocumentTypeCode } from '@/modules/documents/document/model/document-type-codes'
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

/** BE DocumentLinkResponse (camelCase, enum names UPPER_SNAKE) */
interface BeDocumentLink {
  id: string
  documentId: string
  projectId?: string | null
  linkedEntityType: string
  linkedEntityId: string
  relationType: string
  archivedAt?: string | null
  createdAt?: string | null
  createdBy?: string | null
}

interface BeBulkCreateDocumentLinksResult {
  createdCount: number
  skippedDuplicateCount: number
  failedCount: number
  createdLinks: BeDocumentLink[]
  skippedDocuments: string[]
}

function toFeEntityType(value: string): DocumentLinkedEntityType {
  return value.toLowerCase() as DocumentLinkedEntityType
}

function toFeRelationType(value: string): DocumentRelationType {
  return value.toLowerCase() as DocumentRelationType
}

/** BE stores enum `.name()` (REQUIREMENT); queries are case-sensitive. */
function toBeEntityType(value: DocumentLinkedEntityType): string {
  return value.toUpperCase()
}

function toBeRelationType(value: DocumentRelationType): string {
  return value.toUpperCase()
}

function mapBeDocumentLink(be: BeDocumentLink, orgId: string): DocumentLink {
  const createdAt = be.createdAt ?? ''
  return {
    id: be.id,
    org_id: orgId,
    project_id: be.projectId ?? null,
    document_id: be.documentId,
    linked_entity_type: toFeEntityType(be.linkedEntityType),
    linked_entity_id: be.linkedEntityId,
    relation_type: toFeRelationType(be.relationType),
    title_snapshot: null,
    metadata_json: null,
    created_by: be.createdBy ?? null,
    created_at: createdAt,
    updated_at: createdAt,
    archived_at: be.archivedAt ?? null,
  }
}

function mapBeToLinkedDocument(
  be: BeDocumentLink,
  orgId: string
): LinkedDocumentForEntity {
  return {
    ...mapBeDocumentLink(be, orgId),
    document_title: 'Untitled',
    document_status: 'active',
    document_type: 'other',
    workflow_status: 'draft',
  }
}

export async function listDocumentLinks(
  orgId: string,
  documentId: string,
  projectId?: string,
  includeArchived?: boolean
): Promise<{ items: DocumentLink[]; page?: { limit: number; offset: number; total: number } }> {
  const base = DOCUMENT_ENDPOINTS.listLinks(orgId, documentId, projectId)
  const url = includeArchived
    ? `${base}${base.includes('?') ? '&' : '?'}include_archived=true`
    : base
  const res = await apiClient.get<ListPayload<DocumentLink>>(url)
  const { items } = normalizeItemList(res)
  return {
    items,
    page: !Array.isArray(res) && res?.page ? (res.page as { limit: number; offset: number; total: number }) : undefined,
  }
}

/**
 * BE has no single-create path (`POST .../documents/{id}/links`).
 * Create via bulk endpoint with one document id.
 */
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
  const result = await bulkCreateDocumentLinks(orgId, {
    project_id: body.project_id,
    linked_entity_type: body.linked_entity_type,
    linked_entity_id: body.linked_entity_id,
    session_id: body.session_id,
    relation_type: body.relation_type,
    document_ids: [documentId],
  })

  const created = result.created_links[0]
  if (created) return created

  if (result.skipped_documents.includes(documentId)) {
    throw new ApiError(409, {
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      detail: 'This document is already linked to the selected entity',
      code: 'DOCUMENT_LINK_DUPLICATE',
    })
  }

  throw new ApiError(500, {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    detail: 'Failed to create document link',
  })
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
  const res = await apiClient.get<ListPayload<BeDocumentLink> & { page?: { limit: number; offset: number; total: number } }>(
    DOCUMENT_ENDPOINTS.byEntity(orgId, {
      ...params,
      linked_entity_type: toBeEntityType(params.linked_entity_type),
      relation_type: params.relation_type
        ? toBeRelationType(params.relation_type)
        : undefined,
    })
  )

  let items = normalizeList(res).map((link) => mapBeToLinkedDocument(link, orgId))
  const page =
    !Array.isArray(res) && res?.page
      ? res.page
      : { limit: items.length, offset: 0, total: items.length }

  // BE by-entity returns link rows only — enrich titles/status from project documents.
  if (items.length > 0 && params.project_id) {
    try {
      const docs = await listProjectDocuments(params.project_id)
      const byId = new Map(docs.items.map((d) => [d.id, d]))
      items = items.map((link) => {
        const doc = byId.get(link.document_id)
        if (!doc) return link
        const rawStatus = (doc.status ?? '').toUpperCase()
        const documentStatus =
          rawStatus === 'ARCHIVED' || rawStatus === 'DELETED_SOFT' ? 'archived' : 'active'
        const workflow =
          rawStatus === 'IN_REVIEW'
            ? 'in_review'
            : rawStatus === 'APPROVED'
              ? 'approved'
              : 'draft'
        return {
          ...link,
          document_title: (doc.title ?? doc.code ?? 'Untitled').trim() || 'Untitled',
          document_status: documentStatus,
          document_type: fromBeDocumentTypeCode(doc.documentTypeCode),
          workflow_status: workflow,
          updated_at: doc.createdAt ?? link.updated_at,
        }
      })
    } catch {
      /* keep defaults */
    }
  }

  if (params.document_status) {
    items = items.filter((item) => item.document_status === params.document_status)
  }

  return { items, page }
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
  // BE BulkCreateDocumentLinksRequest is camelCase; fromString accepts any case.
  const res = await apiClient.post<BeBulkCreateDocumentLinksResult>(
    DOCUMENT_ENDPOINTS.bulkCreate(orgId),
    {
      projectId: body.project_id,
      linkedEntityType: toBeEntityType(body.linked_entity_type),
      linkedEntityId: body.linked_entity_id,
      relationType: toBeRelationType(body.relation_type),
      documentIds: body.document_ids,
    }
  )

  return {
    created_count: res.createdCount ?? 0,
    skipped_duplicate_count: res.skippedDuplicateCount ?? 0,
    failed_count: res.failedCount ?? 0,
    created_links: (res.createdLinks ?? []).map((link) => mapBeDocumentLink(link, orgId)),
    skipped_documents: (res.skippedDocuments ?? []).map(String),
  }
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
  const res = await apiClient.get<{ counts?: Record<string, number> } | Record<string, number>>(
    DOCUMENT_ENDPOINTS.entityLinkCounts(orgId, {
      ...params,
      linked_entity_type: toBeEntityType(params.linked_entity_type),
    })
  )
  const raw =
    res && typeof res === 'object' && 'counts' in res && res.counts && typeof res.counts === 'object'
      ? res.counts
      : (res as Record<string, number>)
  const counts: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw ?? {})) {
    counts[key] = Number(value) || 0
  }
  return { counts }
}

async function listTraceLinks(orgId: string, projectId: string): Promise<TraceLinksListResponse> {
  return apiClient.get<TraceLinksListResponse>(PROJECT_ENDPOINTS.traceLinks(orgId, projectId), {
    skipErrorToast: true,
  })
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
