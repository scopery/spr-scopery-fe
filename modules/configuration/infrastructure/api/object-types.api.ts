import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type { ObjectType } from '../../domain/model/object-type'

export async function listObjectTypes(): Promise<ObjectType[]> {
  return apiClient.get<ObjectType[]>(CONFIGURATION_ENDPOINTS.objectTypes.list())
}
