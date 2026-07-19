import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type {
  CreateStatusSetPayload,
  CreateStatusValuePayload,
  StatusSet,
  StatusValue,
} from '../../domain/model/status-set'

export async function listStatusSets(workspaceId: string): Promise<StatusSet[]> {
  return apiClient.get<StatusSet[]>(CONFIGURATION_ENDPOINTS.statusSets.list(workspaceId))
}

export async function createStatusSet(
  workspaceId: string,
  body: CreateStatusSetPayload
): Promise<StatusSet> {
  return apiClient.post<StatusSet>(CONFIGURATION_ENDPOINTS.statusSets.create(workspaceId), body)
}

export async function listStatusValues(
  workspaceId: string,
  setId: string
): Promise<StatusValue[]> {
  return apiClient.get<StatusValue[]>(
    CONFIGURATION_ENDPOINTS.statusSets.values.list(workspaceId, setId)
  )
}

export async function createStatusValue(
  workspaceId: string,
  setId: string,
  body: CreateStatusValuePayload
): Promise<StatusValue> {
  return apiClient.post<StatusValue>(
    CONFIGURATION_ENDPOINTS.statusSets.values.create(workspaceId, setId),
    body
  )
}
