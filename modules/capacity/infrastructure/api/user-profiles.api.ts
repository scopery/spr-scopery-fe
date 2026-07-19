import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../domain/model/common'
import type {
  CreateUserCapacityProfilePayload,
  UpdateUserCapacityProfilePayload,
  UserCapacityProfile,
  UserCapacityProfileSearchParams,
} from '../../domain/model/user-capacity-profile'

export async function listUserCapacityProfiles(
  params: UserCapacityProfileSearchParams
): Promise<PageResponse<UserCapacityProfile>> {
  return apiClient.get<PageResponse<UserCapacityProfile>>(
    CAPACITY_ENDPOINTS.userProfiles.list(params)
  )
}

export async function createUserCapacityProfile(
  workspaceId: string,
  body: CreateUserCapacityProfilePayload
): Promise<UserCapacityProfile> {
  return apiClient.post<UserCapacityProfile>(
    CAPACITY_ENDPOINTS.userProfiles.create(workspaceId),
    body
  )
}

export async function updateUserCapacityProfile(
  profileId: string,
  body: UpdateUserCapacityProfilePayload
): Promise<UserCapacityProfile> {
  return apiClient.put<UserCapacityProfile>(
    CAPACITY_ENDPOINTS.userProfiles.update(profileId),
    body
  )
}

export async function activateUserCapacityProfile(
  profileId: string
): Promise<UserCapacityProfile> {
  return apiClient.patch<UserCapacityProfile>(
    CAPACITY_ENDPOINTS.userProfiles.activate(profileId)
  )
}

export async function deactivateUserCapacityProfile(
  profileId: string
): Promise<UserCapacityProfile> {
  return apiClient.patch<UserCapacityProfile>(
    CAPACITY_ENDPOINTS.userProfiles.deactivate(profileId)
  )
}

export async function archiveUserCapacityProfile(
  profileId: string
): Promise<UserCapacityProfile> {
  return apiClient.patch<UserCapacityProfile>(
    CAPACITY_ENDPOINTS.userProfiles.archive(profileId)
  )
}
