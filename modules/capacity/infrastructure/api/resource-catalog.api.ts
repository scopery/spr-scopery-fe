import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type {
  CreateResourceRolePayload,
  CreateResourceSkillPayload,
  ResourceRole,
  ResourceSkill,
} from '../../domain/model/resource-catalog'

export async function listResourceRoles(workspaceId: string): Promise<ResourceRole[]> {
  return apiClient.get<ResourceRole[]>(CAPACITY_ENDPOINTS.roles.list(workspaceId))
}

export async function createResourceRole(
  workspaceId: string,
  body: CreateResourceRolePayload
): Promise<ResourceRole> {
  return apiClient.post<ResourceRole>(CAPACITY_ENDPOINTS.roles.create(workspaceId), body)
}

export async function listResourceSkills(workspaceId: string): Promise<ResourceSkill[]> {
  return apiClient.get<ResourceSkill[]>(CAPACITY_ENDPOINTS.skills.list(workspaceId))
}

export async function createResourceSkill(
  workspaceId: string,
  body: CreateResourceSkillPayload
): Promise<ResourceSkill> {
  return apiClient.post<ResourceSkill>(CAPACITY_ENDPOINTS.skills.create(workspaceId), body)
}
