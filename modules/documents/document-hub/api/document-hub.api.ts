import { DOCUMENT_HUB_ENDPOINTS } from '../../endpoints'
import * as projectsApi from '@/modules/projects/project/api/projects.api'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeList } from '@/shared/lib/normalizeListResponse'
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
export type { ProjectListItem } from '@/modules/projects/project/model/project'

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
  code?: string | null
  content_mode?: string | null
}

export interface DocumentHubResponse {
  items: DocumentHubItem[]
  page: { limit: number; offset: number; total: number }
}

/** Raw BE DocumentResponse (camelCase) from GET /projects/{id}/documents */
interface BeDocumentListItem {
  id: string
  projectId?: string
  project_id?: string
  code?: string | null
  title?: string | null
  status?: string | null
  currentVersionId?: string | null
  createdAt?: string | null
  created_at?: string | null
  contentMode?: string | null
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

function mapBeDocumentToHubItem(
  doc: BeDocumentListItem,
  projectName?: string | null
): DocumentHubItem {
  const projectId = doc.projectId ?? doc.project_id ?? null
  const createdAt = doc.createdAt ?? doc.created_at ?? ''
  return {
    id: doc.id,
    title: (doc.title ?? doc.code ?? 'Untitled').trim() || 'Untitled',
    document_type: 'other',
    origin_type: 'manual',
    generated_by_ai: false,
    status: mapBeStatusToLifecycle(doc.status),
    workflow_status: mapBeStatusToWorkflow(doc.status),
    created_by: null,
    creator_display_name: null,
    created_at: createdAt,
    updated_at: createdAt,
    project_id: projectId,
    project_name: projectName ?? null,
    section_id: null,
    section_name: null,
    snippet: doc.description?.trim() || doc.code || '',
    code: doc.code ?? null,
    content_mode: doc.contentMode ?? null,
  }
}

export function listProjects(workspaceId: string) {
  return projectsApi.listProjects(workspaceId, { size: 100, page: 0 })
}

async function fetchProjectDocuments(
  projectId: string,
  search?: string
): Promise<BeDocumentListItem[]> {
  const endpoint = DOCUMENT_HUB_ENDPOINTS.list('', {
    project_id: projectId,
    search: search?.trim() || undefined,
    limit: 100,
  })
  const raw = await apiClient.get<unknown>(endpoint, { skipErrorToast: true })
  return normalizeList<BeDocumentListItem>(raw as BeDocumentListItem[])
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
  const projectNameById = new Map<string, string>()
  let projectIds: string[] = []

  if (params.project_id) {
    projectIds = [params.project_id]
  } else {
    // Workspace / “All projects”: fan-out — BE has no cross-project hub list.
    try {
      const projects = await projectsApi.listProjects(orgId, { size: 100, page: 0 })
      for (const p of projects.items) {
        projectIds.push(p.id)
        projectNameById.set(p.id, p.name)
      }
    } catch {
      return { items: [], page: { limit: params.limit, offset: 0, total: 0 } }
    }
  }

  if (projectIds.length === 0) {
    return { items: [], page: { limit: params.limit, offset: 0, total: 0 } }
  }

  // Resolve names for the single-project case too
  if (params.project_id && !projectNameById.has(params.project_id)) {
    try {
      const projects = await projectsApi.listProjects(orgId, { size: 100, page: 0 })
      for (const p of projects.items) projectNameById.set(p.id, p.name)
    } catch {
      /* optional */
    }
  }

  const batches = await Promise.all(
    projectIds.map(async (projectId) => {
      try {
        const docs = await fetchProjectDocuments(projectId, params.search)
        return docs.map((d) =>
          mapBeDocumentToHubItem(d, projectNameById.get(d.projectId ?? d.project_id ?? projectId))
        )
      } catch {
        return [] as DocumentHubItem[]
      }
    })
  )

  let items = batches.flat()

  // Client-side filters (BE list is project-scoped and thin)
  items = items.filter((d) => d.status === params.status)
  if (params.workflow_status) {
    items = items.filter((d) => d.workflow_status === params.workflow_status)
  }
  if (params.document_type) {
    items = items.filter((d) => d.document_type === params.document_type)
  }
  if (params.origin_type) {
    items = items.filter((d) => d.origin_type === params.origin_type)
  }
  if (params.generated_by_ai === true) {
    items = items.filter((d) => d.generated_by_ai)
  } else if (params.generated_by_ai === false) {
    items = items.filter((d) => !d.generated_by_ai)
  }
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase()
    items = items.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.code ?? '').toLowerCase().includes(q) ||
        (d.snippet ?? '').toLowerCase().includes(q) ||
        (d.project_name ?? '').toLowerCase().includes(q)
    )
  }

  items.sort((a, b) => {
    const ta = new Date(a.updated_at).getTime() || 0
    const tb = new Date(b.updated_at).getTime() || 0
    return tb - ta
  })

  const limited = items.slice(0, params.limit)

  return {
    items: limited,
    page: {
      limit: params.limit,
      offset: 0,
      total: items.length,
    },
  }
}

export { exportDocumentHub, previewDocumentHubExport, formatExportSize }
export { resolveHubDeliverableSelection, getHubDeliverableContext, restoreDocument }
