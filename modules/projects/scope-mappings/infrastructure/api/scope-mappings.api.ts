import { apiClient } from '@/shared/lib/apiClient'
import { SCOPE_MAPPING_ENDPOINTS } from './endpoints'
import type {
  ScopeWbsMapping,
  DeliverableTaskMapping,
  CreateWbsMappingPayload,
  CreateTaskMappingPayload,
} from '../../domain/model/scope-mapping'

export async function listWbsMappings(scopeItemId: string): Promise<ScopeWbsMapping[]> {
  return apiClient.get<ScopeWbsMapping[]>(SCOPE_MAPPING_ENDPOINTS.wbsMappings(scopeItemId))
}

export async function createWbsMapping(
  scopeItemId: string,
  body: CreateWbsMappingPayload
): Promise<ScopeWbsMapping> {
  return apiClient.post<ScopeWbsMapping>(SCOPE_MAPPING_ENDPOINTS.wbsMappings(scopeItemId), body)
}

export async function deleteWbsMapping(mappingId: string): Promise<void> {
  await apiClient.delete<void>(SCOPE_MAPPING_ENDPOINTS.wbsMapping(mappingId), { parseJson: false })
}

export async function listTaskMappings(deliverableId: string): Promise<DeliverableTaskMapping[]> {
  return apiClient.get<DeliverableTaskMapping[]>(
    SCOPE_MAPPING_ENDPOINTS.taskMappings(deliverableId)
  )
}

export async function createTaskMapping(
  deliverableId: string,
  body: CreateTaskMappingPayload
): Promise<DeliverableTaskMapping> {
  return apiClient.post<DeliverableTaskMapping>(
    SCOPE_MAPPING_ENDPOINTS.taskMappings(deliverableId),
    body
  )
}

export async function deleteTaskMapping(mappingId: string): Promise<void> {
  await apiClient.delete<void>(SCOPE_MAPPING_ENDPOINTS.taskMapping(mappingId), {
    parseJson: false,
  })
}
