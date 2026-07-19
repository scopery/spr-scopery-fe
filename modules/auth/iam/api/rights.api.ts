import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type { IamPageResponse, IamRight, SearchRightsParams } from '../model'

export async function searchRights(
  params?: SearchRightsParams
): Promise<IamPageResponse<IamRight>> {
  return apiClient.get<IamPageResponse<IamRight>>(IAM_ENDPOINTS.rights.search(params))
}

export async function getRight(rightId: string): Promise<IamRight> {
  return apiClient.get<IamRight>(IAM_ENDPOINTS.rights.get(rightId))
}
