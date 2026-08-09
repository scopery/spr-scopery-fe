import { apiClient } from '@/shared/lib/apiClient'
import { assertBulkItemCount, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { WBS_ENDPOINTS } from './endpoints'
import type {
  CreateWbsNodePayload,
  MoveWbsNodePayload,
  UpdateWbsNodePayload,
  WbsNode,
} from '../../domain/model/wbs'

export async function getWbsTree(
  projectId: string,
  phaseId?: string
): Promise<WbsNode[]> {
  const res = await apiClient.get<WbsNode[] | { items: WbsNode[] }>(
    WBS_ENDPOINTS.tree(projectId, phaseId)
  )
  return Array.isArray(res) ? res : res.items ?? []
}

export async function createWbsNode(
  projectId: string,
  body: CreateWbsNodePayload
): Promise<WbsNode> {
  return apiClient.post<WbsNode>(WBS_ENDPOINTS.create(projectId), body)
}

/** Async bulk create — returns job; UI polls GET /bulk-jobs/{id}. */
export async function submitWbsNodesBulk(
  projectId: string,
  items: CreateWbsNodePayload[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(WBS_ENDPOINTS.bulk(projectId), { items }, { skipGlobalLoading: true })
}

export async function updateWbsNode(
  projectId: string,
  id: string,
  body: UpdateWbsNodePayload
): Promise<WbsNode> {
  return apiClient.put<WbsNode>(WBS_ENDPOINTS.update(projectId, id), body)
}

export async function moveWbsNode(
  projectId: string,
  id: string,
  body: MoveWbsNodePayload
): Promise<WbsNode> {
  return apiClient.patch<WbsNode>(WBS_ENDPOINTS.move(projectId, id), body)
}

export async function archiveWbsNode(projectId: string, id: string): Promise<WbsNode> {
  return apiClient.patch<WbsNode>(WBS_ENDPOINTS.archive(projectId, id))
}

export async function deleteWbsNode(projectId: string, id: string): Promise<void> {
  return apiClient.delete(WBS_ENDPOINTS.delete(projectId, id))
}
