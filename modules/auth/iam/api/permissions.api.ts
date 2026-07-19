import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type {
  IamPageResponse,
  IamPermission,
  IamPermissionAction,
  SearchPermissionsParams,
} from '../model'

export async function getPermissionsMatrix(): Promise<IamPermission[]> {
  return apiClient.get<IamPermission[]>(IAM_ENDPOINTS.permissions.matrix())
}

export async function searchPermissions(
  params?: SearchPermissionsParams
): Promise<IamPageResponse<IamPermission>> {
  return apiClient.get<IamPageResponse<IamPermission>>(
    IAM_ENDPOINTS.permissions.search(params as Record<string, string | number | boolean | undefined>)
  )
}

export async function getPermission(permissionId: string): Promise<IamPermission> {
  return apiClient.get<IamPermission>(IAM_ENDPOINTS.permissions.get(permissionId))
}

export async function listPermissionActions(permissionId: string): Promise<IamPermissionAction[]> {
  return apiClient.get<IamPermissionAction[]>(IAM_ENDPOINTS.permissions.listActions(permissionId))
}
