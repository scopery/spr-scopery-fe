import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type { IamMe } from '../model'

export async function getMe(): Promise<IamMe> {
  return apiClient.get<IamMe>(IAM_ENDPOINTS.me.get())
}
