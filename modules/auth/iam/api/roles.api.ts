import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type {
  CreateSystemRolePayload,
  CreateWorkspaceRolePayload,
  IamPageResponse,
  IamRole,
  SearchRolesParams,
  UpdateRolePayload,
} from '../model'

export async function searchRoles(
  params?: SearchRolesParams
): Promise<IamPageResponse<IamRole>> {
  return apiClient.get<IamPageResponse<IamRole>>(IAM_ENDPOINTS.roles.search(params))
}

export async function getRole(roleId: string): Promise<IamRole> {
  return apiClient.get<IamRole>(IAM_ENDPOINTS.roles.get(roleId))
}

export async function createSystemRole(body: CreateSystemRolePayload): Promise<IamRole> {
  return apiClient.post<IamRole>(IAM_ENDPOINTS.roles.createSystem(), body)
}

export async function createWorkspaceRole(body: CreateWorkspaceRolePayload): Promise<IamRole> {
  return apiClient.post<IamRole>(IAM_ENDPOINTS.roles.createWorkspace(), body)
}

export async function updateRole(roleId: string, body: UpdateRolePayload): Promise<IamRole> {
  return apiClient.put<IamRole>(IAM_ENDPOINTS.roles.update(roleId), body)
}

export async function activateRole(roleId: string): Promise<IamRole> {
  return apiClient.patch<IamRole>(IAM_ENDPOINTS.roles.activate(roleId))
}

export async function deactivateRole(roleId: string): Promise<IamRole> {
  return apiClient.patch<IamRole>(IAM_ENDPOINTS.roles.deactivate(roleId))
}

export async function softDeleteRole(roleId: string): Promise<IamRole> {
  return apiClient.patch<IamRole>(IAM_ENDPOINTS.roles.softDelete(roleId))
}
