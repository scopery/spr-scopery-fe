/**
 * Controlled values service — create/update/delete values for a controlled list.
 * Uses apiClient + CONTROLLED_VALUE_ENDPOINTS only.
 */

import { CONTROLLED_VALUE_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { ControlledValue, CreateValuePayload, UpdateValuePatch } from '@/types/controlled-lists'

function orgHeaders(orgId: string): RequestInit['headers'] {
  return { 'x-org-id': orgId }
}

export async function createControlledValue(
  ctx: { orgId: string },
  listId: string,
  payload: CreateValuePayload
): Promise<ControlledValue> {
  return apiClient.post<ControlledValue>(CONTROLLED_VALUE_ENDPOINTS.createInList(listId), payload, {
    headers: orgHeaders(ctx.orgId),
  })
}

export async function updateControlledValue(
  ctx: { orgId: string },
  valueId: string,
  patch: UpdateValuePatch
): Promise<ControlledValue> {
  return apiClient.patch<ControlledValue>(CONTROLLED_VALUE_ENDPOINTS.update(valueId), patch, {
    headers: orgHeaders(ctx.orgId),
  })
}

export async function deleteControlledValue(ctx: { orgId: string }, valueId: string): Promise<void> {
  await apiClient.delete<unknown>(CONTROLLED_VALUE_ENDPOINTS.remove(valueId), {
    headers: orgHeaders(ctx.orgId),
  })
}
