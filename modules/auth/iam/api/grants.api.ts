import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type {
  AddGrantRightPayload,
  AddGrantPermissionActionPayload,
  CreateDelegationPayload,
  CreateGrantPayload,
  IamGrant,
  IamGrantPermissionAction,
  IamGrantRight,
  IamPageResponse,
  SearchGrantsParams,
} from '../model'

export async function searchGrants(
  params?: SearchGrantsParams
): Promise<IamPageResponse<IamGrant>> {
  return apiClient.get<IamPageResponse<IamGrant>>(IAM_ENDPOINTS.grants.search(params))
}

export async function getGrant(grantId: string): Promise<IamGrant> {
  return apiClient.get<IamGrant>(IAM_ENDPOINTS.grants.get(grantId))
}

export async function createGrant(body: CreateGrantPayload): Promise<IamGrant> {
  return apiClient.post<IamGrant>(IAM_ENDPOINTS.grants.create(), body)
}

export async function revokeGrant(grantId: string): Promise<IamGrant> {
  return apiClient.patch<IamGrant>(IAM_ENDPOINTS.grants.revoke(grantId))
}

export async function listGrantRights(grantId: string): Promise<IamGrantRight[]> {
  return apiClient.get<IamGrantRight[]>(IAM_ENDPOINTS.grants.listRights(grantId))
}

export async function addGrantRight(
  grantId: string,
  body: AddGrantRightPayload
): Promise<IamGrantRight> {
  return apiClient.post<IamGrantRight>(IAM_ENDPOINTS.grants.addRight(grantId), body)
}

export async function removeGrantRight(grantId: string, rightId: string): Promise<void> {
  await apiClient.delete<void>(IAM_ENDPOINTS.grants.removeRight(grantId, rightId), {
    parseJson: false,
  })
}

export async function listGrantActions(grantId: string): Promise<IamGrantPermissionAction[]> {
  return apiClient.get<IamGrantPermissionAction[]>(IAM_ENDPOINTS.grants.listActions(grantId))
}

export async function addGrantAction(
  grantId: string,
  body: AddGrantPermissionActionPayload
): Promise<IamGrantPermissionAction> {
  return apiClient.post<IamGrantPermissionAction>(IAM_ENDPOINTS.grants.addAction(grantId), body)
}

export async function removeGrantAction(
  grantId: string,
  permissionActionId: string
): Promise<void> {
  await apiClient.delete<void>(
    IAM_ENDPOINTS.grants.removeAction(grantId, permissionActionId),
    { parseJson: false }
  )
}

export async function createDelegation(body: CreateDelegationPayload): Promise<IamGrant> {
  return apiClient.post<IamGrant>(IAM_ENDPOINTS.grants.delegate(), body)
}
