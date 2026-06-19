import { CONTROLLED_LIST_ENDPOINTS } from './endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  ControlledList,
  CreateListPayload,
  UpdateListPatch,
} from '../model/controlled-lists-types'

function orgHeaders(orgId: string): RequestInit['headers'] {
  return { 'x-org-id': orgId }
}

type ListResponseShape = ControlledList[] | { items?: ControlledList[]; data?: ControlledList[] }

export async function listControlledLists(
  orgId: string,
  projectId: string
): Promise<ControlledList[]> {
  const res = await apiClient.get<ListResponseShape>(
    CONTROLLED_LIST_ENDPOINTS.listInProject(projectId),
    { headers: orgHeaders(orgId) }
  )
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.items)) return res.items
  if (Array.isArray(res.data)) return res.data
  return []
}

export async function createControlledList(
  orgId: string,
  projectId: string,
  payload: CreateListPayload
): Promise<ControlledList> {
  return apiClient.post<ControlledList>(
    CONTROLLED_LIST_ENDPOINTS.createInProject(projectId),
    payload,
    {
      headers: orgHeaders(orgId),
    }
  )
}

export async function getControlledList(orgId: string, listId: string): Promise<ControlledList> {
  return apiClient.get<ControlledList>(CONTROLLED_LIST_ENDPOINTS.get(listId), {
    headers: orgHeaders(orgId),
  })
}

export async function updateControlledList(
  orgId: string,
  projectId: string,
  listId: string,
  patch: UpdateListPatch
): Promise<ControlledList> {
  return apiClient.patch<ControlledList>(
    CONTROLLED_LIST_ENDPOINTS.updateInProject(projectId, listId),
    patch,
    { headers: orgHeaders(orgId) }
  )
}

export async function deleteControlledList(
  orgId: string,
  projectId: string,
  listId: string
): Promise<void> {
  await apiClient.delete<unknown>(CONTROLLED_LIST_ENDPOINTS.removeInProject(projectId, listId), {
    headers: orgHeaders(orgId),
  })
}
