import { PROJECT_ENDPOINTS } from '../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import * as projectTemplatesApi from '@/modules/admin/project-templates/infrastructure/api/project-templates.api'
import type {
  CreateProjectPayload,
  ProjectDetail,
  ProjectListResponse,
  ProjectPageResponse,
  ProjectV1,
  UpdateProjectPayload,
} from '../model/project'
import { mapProjectV1ToDetail, mapProjectV1ToListItem } from '../model/project'

export interface PublishedProjectTemplateOption {
  templateId: string
  versionId: string
  name: string
  versionLabel: string
  /** Select value: `templateId:versionId` */
  value: string
}

function toListResponse(page: ProjectPageResponse): ProjectListResponse {
  const items = (page.items ?? []).map(mapProjectV1ToListItem)
  const size = page.size ?? 20
  const pageIndex = page.page ?? 0
  return {
    items,
    page: {
      limit: size,
      offset: pageIndex * size,
      total: page.totalElements ?? items.length,
    },
  }
}

export async function listProjects(
  workspaceId: string,
  params?: { keyword?: string; status?: string; page?: number; size?: number }
): Promise<ProjectListResponse> {
  const url = PROJECT_ENDPOINTS.list(workspaceId, {
    keyword: params?.keyword,
    status: params?.status,
    page: params?.page ?? 0,
    size: params?.size ?? 100,
  })
  const page = await apiClient.get<ProjectPageResponse>(url)
  return toListResponse(page)
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const raw = await apiClient.get<ProjectV1>(PROJECT_ENDPOINTS.get(projectId))
  return mapProjectV1ToDetail(raw)
}

export async function createProject(body: CreateProjectPayload): Promise<ProjectDetail> {
  const raw = await apiClient.post<ProjectV1>(PROJECT_ENDPOINTS.create(), body)
  return mapProjectV1ToDetail(raw)
}

export async function updateProject(
  projectId: string,
  body: UpdateProjectPayload
): Promise<ProjectDetail> {
  const raw = await apiClient.put<ProjectV1>(PROJECT_ENDPOINTS.update(projectId), body)
  return mapProjectV1ToDetail(raw)
}

export async function activateProject(projectId: string): Promise<ProjectDetail> {
  const raw = await apiClient.patch<ProjectV1>(PROJECT_ENDPOINTS.activate(projectId))
  return mapProjectV1ToDetail(raw)
}

export async function holdProject(projectId: string): Promise<ProjectDetail> {
  const raw = await apiClient.patch<ProjectV1>(PROJECT_ENDPOINTS.hold(projectId))
  return mapProjectV1ToDetail(raw)
}

export async function completeProject(projectId: string): Promise<ProjectDetail> {
  const raw = await apiClient.patch<ProjectV1>(PROJECT_ENDPOINTS.complete(projectId))
  return mapProjectV1ToDetail(raw)
}

export async function archiveProject(projectId: string): Promise<ProjectDetail> {
  const raw = await apiClient.patch<ProjectV1>(PROJECT_ENDPOINTS.archive(projectId))
  return mapProjectV1ToDetail(raw)
}

function isPublishedVersionStatus(status: string): boolean {
  const s = status.toUpperCase()
  return s === 'PUBLISHED' || s === 'ACTIVE'
}

/**
 * Active project templates with at least one published version —
 * for Create Project wizard (Wave 2 apply endpoint).
 */
export async function listPublishedTemplates(
  workspaceId: string,
  size = 50
): Promise<PublishedProjectTemplateOption[]> {
  const page = await projectTemplatesApi.listProjectTemplates({
    workspaceId,
    status: 'ACTIVE',
    page: 0,
    size,
  })
  const templates = page.items ?? []
  const options: PublishedProjectTemplateOption[] = []

  await Promise.all(
    templates.map(async (template) => {
      try {
        const versions = await projectTemplatesApi.listTemplateVersions(template.id)
        for (const version of versions) {
          if (!isPublishedVersionStatus(version.status)) continue
          options.push({
            templateId: template.id,
            versionId: version.id,
            name: template.name,
            versionLabel: version.name || `v${version.versionNumber}`,
            value: `${template.id}:${version.id}`,
          })
        }
      } catch {
        // Skip templates whose versions cannot be loaded
      }
    })
  )

  return options.sort((a, b) => a.name.localeCompare(b.name))
}

/** Creates a project by applying a published template version. */
export async function createProjectFromTemplate(body: {
  workspaceId: string
  templateId: string
  versionId: string
  code: string
  name: string
  description?: string
  ownerUserId?: string
  defaultCurrency?: string
  plannedStartDate?: string
  plannedEndDate?: string
}): Promise<{ id: string }> {
  return projectTemplatesApi.applyProjectTemplate(body.templateId, body.versionId, {
    workspaceId: body.workspaceId,
    projectCode: body.code,
    projectName: body.name,
    projectDescription: body.description ?? null,
    ownerUserId: body.ownerUserId ?? null,
    defaultCurrency: body.defaultCurrency ?? null,
    plannedStartDate: body.plannedStartDate ?? null,
    plannedEndDate: body.plannedEndDate ?? null,
    includeTemplateTasks: true,
    includeTemplateDependencies: true,
    copyEstimateHours: true,
  })
}
