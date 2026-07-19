import { apiClient } from '@/shared/lib/apiClient'
import { PROJECT_TEMPLATE_ENDPOINTS } from './endpoints'
import type {
  ApplyProjectTemplatePayload,
  CreateProjectTemplatePhasePayload,
  CreateProjectTemplateTaskDependencyPayload,
  CreateProjectTemplateTaskPayload,
  CreateProjectTemplateVersionPayload,
  ProjectTemplate,
  ProjectTemplatePage,
  ProjectTemplatePhase,
  ProjectTemplateTask,
  ProjectTemplateTaskDependency,
  ProjectTemplateVersion,
} from '../../domain/model/project-template'

function unwrapList<T>(res: T[] | { items: T[] }): T[] {
  return Array.isArray(res) ? res : res.items ?? []
}

export async function listProjectTemplates(params?: {
  scope?: string
  workspaceId?: string
  status?: string
  keyword?: string
  page?: number
  size?: number
}): Promise<ProjectTemplatePage> {
  return apiClient.get<ProjectTemplatePage>(
    PROJECT_TEMPLATE_ENDPOINTS.list({ page: 0, size: 50, ...params })
  )
}

export async function getProjectTemplate(templateId: string): Promise<ProjectTemplate> {
  return apiClient.get<ProjectTemplate>(PROJECT_TEMPLATE_ENDPOINTS.get(templateId))
}

export async function listTemplateVersions(
  templateId: string
): Promise<ProjectTemplateVersion[]> {
  const res = await apiClient.get<
    ProjectTemplateVersion[] | { items: ProjectTemplateVersion[] }
  >(PROJECT_TEMPLATE_ENDPOINTS.versions(templateId))
  return unwrapList(res)
}

export async function getTemplateVersion(
  templateId: string,
  versionId: string
): Promise<ProjectTemplateVersion> {
  return apiClient.get<ProjectTemplateVersion>(
    PROJECT_TEMPLATE_ENDPOINTS.version(templateId, versionId)
  )
}

export async function createTemplateVersion(
  templateId: string,
  body: CreateProjectTemplateVersionPayload
): Promise<ProjectTemplateVersion> {
  return apiClient.post<ProjectTemplateVersion>(
    PROJECT_TEMPLATE_ENDPOINTS.versions(templateId),
    body
  )
}

export async function publishTemplateVersion(
  templateId: string,
  versionId: string
): Promise<ProjectTemplateVersion> {
  return apiClient.patch<ProjectTemplateVersion>(
    PROJECT_TEMPLATE_ENDPOINTS.publishVersion(templateId, versionId)
  )
}

// Template phases (draft version only)
export async function listTemplatePhases(
  templateId: string,
  versionId: string
): Promise<ProjectTemplatePhase[]> {
  const res = await apiClient.get<ProjectTemplatePhase[] | { items: ProjectTemplatePhase[] }>(
    PROJECT_TEMPLATE_ENDPOINTS.phases(templateId, versionId)
  )
  return unwrapList(res)
}

export async function createTemplatePhase(
  templateId: string,
  versionId: string,
  body: CreateProjectTemplatePhasePayload
): Promise<ProjectTemplatePhase> {
  return apiClient.post<ProjectTemplatePhase>(
    PROJECT_TEMPLATE_ENDPOINTS.phases(templateId, versionId),
    body
  )
}

export async function deleteTemplatePhase(
  templateId: string,
  versionId: string,
  phaseId: string
): Promise<void> {
  await apiClient.delete<void>(PROJECT_TEMPLATE_ENDPOINTS.phase(templateId, versionId, phaseId), {
    parseJson: false,
  })
}

// Template tasks (draft version only)
export async function listTemplateTasks(
  templateId: string,
  versionId: string
): Promise<ProjectTemplateTask[]> {
  const res = await apiClient.get<ProjectTemplateTask[] | { items: ProjectTemplateTask[] }>(
    PROJECT_TEMPLATE_ENDPOINTS.tasks(templateId, versionId)
  )
  return unwrapList(res)
}

export async function createTemplateTask(
  templateId: string,
  versionId: string,
  body: CreateProjectTemplateTaskPayload
): Promise<ProjectTemplateTask> {
  return apiClient.post<ProjectTemplateTask>(
    PROJECT_TEMPLATE_ENDPOINTS.tasks(templateId, versionId),
    body
  )
}

export async function deleteTemplateTask(
  templateId: string,
  versionId: string,
  taskId: string
): Promise<void> {
  await apiClient.delete<void>(PROJECT_TEMPLATE_ENDPOINTS.task(templateId, versionId, taskId), {
    parseJson: false,
  })
}

// Template task dependencies (draft version only)
export async function listTemplateTaskDependencies(
  templateId: string,
  versionId: string
): Promise<ProjectTemplateTaskDependency[]> {
  const res = await apiClient.get<
    ProjectTemplateTaskDependency[] | { items: ProjectTemplateTaskDependency[] }
  >(PROJECT_TEMPLATE_ENDPOINTS.taskDependencies(templateId, versionId))
  return unwrapList(res)
}

export async function createTemplateTaskDependency(
  templateId: string,
  versionId: string,
  body: CreateProjectTemplateTaskDependencyPayload
): Promise<ProjectTemplateTaskDependency> {
  return apiClient.post<ProjectTemplateTaskDependency>(
    PROJECT_TEMPLATE_ENDPOINTS.taskDependencies(templateId, versionId),
    body
  )
}

export async function deleteTemplateTaskDependency(
  templateId: string,
  versionId: string,
  dependencyId: string
): Promise<void> {
  await apiClient.delete<void>(
    PROJECT_TEMPLATE_ENDPOINTS.taskDependency(templateId, versionId, dependencyId),
    { parseJson: false }
  )
}

export async function activateProjectTemplate(templateId: string): Promise<ProjectTemplate> {
  return apiClient.patch<ProjectTemplate>(PROJECT_TEMPLATE_ENDPOINTS.activate(templateId))
}

export async function deactivateProjectTemplate(templateId: string): Promise<ProjectTemplate> {
  return apiClient.patch<ProjectTemplate>(PROJECT_TEMPLATE_ENDPOINTS.deactivate(templateId))
}

export async function archiveProjectTemplate(templateId: string): Promise<ProjectTemplate> {
  return apiClient.patch<ProjectTemplate>(PROJECT_TEMPLATE_ENDPOINTS.archive(templateId))
}

export async function applyProjectTemplate(
  templateId: string,
  versionId: string,
  body: ApplyProjectTemplatePayload
): Promise<{ id: string }> {
  return apiClient.post<{ id: string }>(
    PROJECT_TEMPLATE_ENDPOINTS.apply(templateId, versionId),
    body
  )
}
