/**
 * Controlled lists service — list/create/update/delete per project, get detail by ID.
 * Uses apiClient + CONTROLLED_LIST_ENDPOINTS only.
 */

import { CONTROLLED_LIST_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { ControlledList, CreateListPayload, UpdateListPatch } from '@/types/controlled-lists'

function orgHeaders(orgId: string): RequestInit['headers'] {
  return { 'x-org-id': orgId }
}

type ListResponseShape = ControlledList[] | { items?: ControlledList[]; data?: ControlledList[] }

export async function listControlledLists(
  ctx: { orgId: string },
  projectId: string
): Promise<ControlledList[]> {
  const res = await apiClient.get<ListResponseShape>(CONTROLLED_LIST_ENDPOINTS.listInProject(projectId), {
    headers: orgHeaders(ctx.orgId),
  })
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray((res as { items?: ControlledList[] }).items)) return (res as { items: ControlledList[] }).items
  if (Array.isArray((res as { data?: ControlledList[] }).data)) return (res as { data: ControlledList[] }).data
  return []
}

export async function createControlledList(
  ctx: { orgId: string },
  projectId: string,
  payload: CreateListPayload
): Promise<ControlledList> {
  return apiClient.post<ControlledList>(CONTROLLED_LIST_ENDPOINTS.createInProject(projectId), payload, {
    headers: orgHeaders(ctx.orgId),
  })
}

export async function getControlledList(ctx: { orgId: string }, listId: string): Promise<ControlledList> {
  return apiClient.get<ControlledList>(CONTROLLED_LIST_ENDPOINTS.get(listId), {
    headers: orgHeaders(ctx.orgId),
  })
}

export async function updateControlledList(
  ctx: { orgId: string },
  projectId: string,
  listId: string,
  patch: UpdateListPatch
): Promise<ControlledList> {
  return apiClient.patch<ControlledList>(CONTROLLED_LIST_ENDPOINTS.updateInProject(projectId, listId), patch, {
    headers: orgHeaders(ctx.orgId),
  })
}

export async function deleteControlledList(
  ctx: { orgId: string },
  projectId: string,
  listId: string
): Promise<void> {
  await apiClient.delete<unknown>(CONTROLLED_LIST_ENDPOINTS.removeInProject(projectId, listId), {
    headers: orgHeaders(ctx.orgId),
  })
}
