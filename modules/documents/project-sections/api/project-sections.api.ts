import { PROJECT_SECTION_ENDPOINTS, DOCUMENT_ENDPOINTS } from '../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/shared/lib/api-types'
import { normalizeList } from '@/shared/lib/normalizeListResponse'
import type { GroupedProjectDocuments, ProjectSection } from '../model/project-section-types'
import type {
  DocumentType,
  DocumentWorkflowStatus,
  ProjectDocumentListItem,
} from '@/modules/documents/document'
import { fromBeDocumentTypeCode } from '@/modules/documents/document/model/document-type-codes'

/** Raw BE DocumentResponse (camelCase) from GET /projects/{id}/documents */
interface BeDocumentListItem {
  id: string
  projectId?: string
  project_id?: string
  code?: string | null
  title?: string | null
  status?: string | null
  createdAt?: string | null
  created_at?: string | null
  documentTypeCode?: string | null
  description?: string | null
}

function mapBeStatusToLifecycle(status: string | null | undefined): 'active' | 'archived' {
  const s = (status ?? '').toUpperCase()
  if (s === 'ARCHIVED' || s === 'DELETED_SOFT') return 'archived'
  return 'active'
}

function mapBeStatusToWorkflow(status: string | null | undefined): DocumentWorkflowStatus {
  const s = (status ?? '').toUpperCase()
  if (s === 'IN_REVIEW') return 'in_review'
  if (s === 'APPROVED') return 'approved'
  return 'draft'
}

function mapBeDocumentToListItem(
  doc: BeDocumentListItem,
  projectId: string
): ProjectDocumentListItem {
  const createdAt = doc.createdAt ?? doc.created_at ?? ''
  return {
    link_id: doc.id,
    project_id: doc.projectId ?? doc.project_id ?? projectId,
    document_id: doc.id,
    // Sections API not on BE yet — keep unsectioned so docs always surface.
    section_id: null,
    pinned: false,
    display_order: 0,
    title: (doc.title ?? doc.code ?? 'Untitled').trim() || 'Untitled',
    plain_text: doc.description?.trim() || '',
    document_type: fromBeDocumentTypeCode(doc.documentTypeCode),
    visibility: 'project',
    status: mapBeStatusToLifecycle(doc.status),
    workflow_status: mapBeStatusToWorkflow(doc.status),
    origin_type: 'manual',
    created_by: null,
    updated_by: null,
    created_at: createdAt,
    updated_at: createdAt,
    creator_display_name: null,
  }
}

export async function listProjectSections(
  orgId: string,
  projectId: string
): Promise<ProjectSection[]> {
  // BE has document-folders, not project sections yet — tolerate missing endpoint.
  try {
    const res = await apiClient.get<{ items?: ProjectSection[] } | ProjectSection[]>(
      PROJECT_SECTION_ENDPOINTS.list(orgId, projectId),
      { skipErrorToast: true }
    )
    return normalizeList(res)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) return []
    throw err
  }
}

export async function createProjectSection(
  orgId: string,
  projectId: string,
  body: { title: string; description?: string | null }
): Promise<ProjectSection> {
  return apiClient.post<ProjectSection>(PROJECT_SECTION_ENDPOINTS.create(orgId, projectId), body)
}

export async function updateProjectSection(
  orgId: string,
  projectId: string,
  sectionId: string,
  body: { title?: string; description?: string | null }
): Promise<ProjectSection> {
  return apiClient.patch<ProjectSection>(
    PROJECT_SECTION_ENDPOINTS.update(orgId, projectId, sectionId),
    body
  )
}

export async function archiveProjectSection(
  orgId: string,
  projectId: string,
  sectionId: string
): Promise<ProjectSection> {
  return apiClient.post<ProjectSection>(
    PROJECT_SECTION_ENDPOINTS.archive(orgId, projectId, sectionId),
    {}
  )
}

export async function createDefaultProjectSections(
  orgId: string,
  projectId: string
): Promise<ProjectSection[]> {
  const res = await apiClient.post<{ items: ProjectSection[] }>(
    PROJECT_SECTION_ENDPOINTS.createDefaults(orgId, projectId),
    {}
  )
  return res.items
}

export async function reorderProjectSections(
  orgId: string,
  projectId: string,
  sectionIds: string[]
): Promise<ProjectSection[]> {
  const res = await apiClient.post<{ items: ProjectSection[] }>(
    PROJECT_SECTION_ENDPOINTS.reorder(orgId, projectId),
    { section_ids: sectionIds }
  )
  return res.items
}

/**
 * BE does not expose `/documents/grouped` (that path matches `/{documentId}` and 500s).
 * Compose from GET `/projects/{projectId}/documents` until a real grouped API exists.
 */
export async function listProjectDocumentsGrouped(
  orgId: string,
  projectId: string,
  params?: {
    q?: string
    document_type?: DocumentType
    section_id?: string
    pinned_only?: boolean
    status?: 'active' | 'archived'
    workflow_status?: DocumentWorkflowStatus
  }
): Promise<GroupedProjectDocuments> {
  const raw = await apiClient.get<BeDocumentListItem[] | { items?: BeDocumentListItem[] }>(
    DOCUMENT_ENDPOINTS.listProject(orgId, projectId, {
      q: params?.q,
      document_type: params?.document_type,
      pinned_only: params?.pinned_only,
      status: params?.status,
      workflow_status: params?.workflow_status,
    })
  )

  let items = normalizeList(raw).map((d) => mapBeDocumentToListItem(d, projectId))

  if (params?.status) {
    items = items.filter((d) => d.status === params.status)
  }
  if (params?.workflow_status) {
    items = items.filter((d) => d.workflow_status === params.workflow_status)
  }
  if (params?.document_type) {
    items = items.filter((d) => d.document_type === params.document_type)
  }
  if (params?.q?.trim()) {
    const q = params.q.trim().toLowerCase()
    items = items.filter(
      (d) =>
        d.title.toLowerCase().includes(q) || d.plain_text.toLowerCase().includes(q)
    )
  }
  if (params?.pinned_only) {
    items = items.filter((d) => d.pinned)
  }
  if (params?.section_id) {
    items = items.filter((d) => d.section_id === params.section_id)
  }

  const pinned = items.filter((d) => d.pinned)
  const unsectioned = items.filter((d) => !d.pinned && !d.section_id)

  return {
    sections: [],
    pinned,
    unsectioned,
    total: items.length,
  }
}

export async function moveDocumentToSection(
  orgId: string,
  projectId: string,
  documentId: string,
  sectionId: string | null
): Promise<{ section_id: string | null }> {
  return apiClient.patch<{ section_id: string | null }>(
    DOCUMENT_ENDPOINTS.moveToSection(orgId, projectId, documentId),
    { section_id: sectionId }
  )
}

export async function reorderDocumentsInSection(
  orgId: string,
  projectId: string,
  sectionId: string | null,
  documentIds: string[]
): Promise<{ reordered: number }> {
  return apiClient.post<{ reordered: number }>(
    DOCUMENT_ENDPOINTS.reorderInSection(orgId, projectId),
    { section_id: sectionId, document_ids: documentIds }
  )
}
