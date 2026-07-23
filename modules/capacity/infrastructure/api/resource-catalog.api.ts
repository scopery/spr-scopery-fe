import { apiClient } from '@/shared/lib/apiClient'
import { normalizeList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type {
  CreateResourceRolePayload,
  CreateResourceSkillPayload,
  ResourceRole,
  ResourceSkill,
} from '../../domain/model/resource-catalog'

export async function listResourceRoles(workspaceId: string): Promise<ResourceRole[]> {
  const data = await apiClient.get<ListPayload<ResourceRole>>(
    CAPACITY_ENDPOINTS.roles.list(workspaceId)
  )
  return normalizeList(data)
}

export async function createResourceRole(
  workspaceId: string,
  body: CreateResourceRolePayload
): Promise<ResourceRole> {
  return apiClient.post<ResourceRole>(CAPACITY_ENDPOINTS.roles.create(workspaceId), body)
}

export async function listResourceSkills(workspaceId: string): Promise<ResourceSkill[]> {
  const data = await apiClient.get<ListPayload<ResourceSkill>>(
    CAPACITY_ENDPOINTS.skills.list(workspaceId)
  )
  return normalizeList(data)
}

export async function createResourceSkill(
  workspaceId: string,
  body: CreateResourceSkillPayload
): Promise<ResourceSkill> {
  return apiClient.post<ResourceSkill>(CAPACITY_ENDPOINTS.skills.create(workspaceId), body)
}
