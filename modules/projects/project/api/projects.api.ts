import { PROJECT_ENDPOINTS } from './endpoints'
import { TEMPLATE_ENDPOINTS } from '../../../admin/admin-templates/api/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { ProjectDetail, ProjectListResponse } from '../model/project'

interface TemplateListItem {
  id: string
  name: string
  version: string
  status: string
  created_at: string
}

interface TemplateListResponse {
  items: TemplateListItem[]
  page: { limit: number; offset: number; total: number }
}

function unwrapTemplateList(res: unknown): TemplateListResponse {
  if (res && typeof res === 'object') {
    if ('data' in res && res.data && typeof res.data === 'object') {
      const d = res.data as Record<string, unknown>
      return {
        items: Array.isArray(d.items) ? (d.items as TemplateListItem[]) : [],
        page: (d.page && typeof d.page === 'object'
          ? d.page
          : { limit: 100, offset: 0, total: 0 }) as TemplateListResponse['page'],
      }
    }
    if ('items' in res && Array.isArray((res as TemplateListResponse).items)) {
      return res as TemplateListResponse
    }
  }
  return { items: [], page: { limit: 100, offset: 0, total: 0 } }
}

export async function listProjects(
  orgId: string,
  params?: { limit?: number; offset?: number }
): Promise<ProjectListResponse> {
  const url = PROJECT_ENDPOINTS.list(orgId, params)
  return apiClient.get<ProjectListResponse>(url)
}

export async function getProject(orgId: string, projectId: string): Promise<ProjectDetail> {
  const url = PROJECT_ENDPOINTS.get(orgId, projectId)
  return apiClient.get<ProjectDetail>(url)
}

export async function createProject(
  orgId: string,
  body: { name: string; description?: string; template_id: string }
): Promise<ProjectDetail> {
  const url = PROJECT_ENDPOINTS.create(orgId)
  return apiClient.post<ProjectDetail>(url, body)
}

export async function listPublishedTemplates(limit = 20): Promise<TemplateListItem[]> {
  const url = TEMPLATE_ENDPOINTS.list({ status: 'published', limit, offset: 0 })
  const res = await apiClient.get<unknown>(url)
  return unwrapTemplateList(res).items
}
