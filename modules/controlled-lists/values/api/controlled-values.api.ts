import { CONTROLLED_VALUE_ENDPOINTS } from './endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  ControlledValue,
  CreateValuePayload,
  UpdateValuePatch,
} from '@/modules/controlled-lists/lists/model/controlled-lists-types'

function orgHeaders(orgId: string): RequestInit['headers'] {
  return { 'x-org-id': orgId }
}

export async function createControlledValue(
  orgId: string,
  listId: string,
  payload: CreateValuePayload
): Promise<ControlledValue> {
  return apiClient.post<ControlledValue>(CONTROLLED_VALUE_ENDPOINTS.createInList(listId), payload, {
    headers: orgHeaders(orgId),
  })
}

export async function updateControlledValue(
  orgId: string,
  valueId: string,
  patch: UpdateValuePatch
): Promise<ControlledValue> {
  return apiClient.patch<ControlledValue>(CONTROLLED_VALUE_ENDPOINTS.update(valueId), patch, {
    headers: orgHeaders(orgId),
  })
}

export async function deleteControlledValue(orgId: string, valueId: string): Promise<void> {
  await apiClient.delete<unknown>(CONTROLLED_VALUE_ENDPOINTS.remove(valueId), {
    headers: orgHeaders(orgId),
  })
}
