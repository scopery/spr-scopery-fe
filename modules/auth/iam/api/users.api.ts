import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type { CreateIamUserPayload, IamPageResponse, IamUser, UpdateIamUserPayload } from '../model'

export async function createUser(body: CreateIamUserPayload): Promise<IamUser> {
  return apiClient.post<IamUser>(IAM_ENDPOINTS.users.create(), body)
}

export async function searchUsers(params?: {
  keyword?: string
  status?: string
  page?: number
  size?: number
}): Promise<IamPageResponse<IamUser>> {
  return apiClient.get<IamPageResponse<IamUser>>(IAM_ENDPOINTS.users.search(params))
}

export async function getUser(userId: string): Promise<IamUser> {
  return apiClient.get<IamUser>(IAM_ENDPOINTS.users.get(userId))
}

export async function updateUser(userId: string, body: UpdateIamUserPayload): Promise<IamUser> {
  return apiClient.put<IamUser>(IAM_ENDPOINTS.users.update(userId), body)
}

export async function activateUser(userId: string): Promise<IamUser> {
  return apiClient.patch<IamUser>(IAM_ENDPOINTS.users.activate(userId))
}

export async function deactivateUser(userId: string): Promise<IamUser> {
  return apiClient.patch<IamUser>(IAM_ENDPOINTS.users.deactivate(userId))
}

export async function suspendUser(userId: string): Promise<IamUser> {
  return apiClient.patch<IamUser>(IAM_ENDPOINTS.users.suspend(userId))
}
