import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { SYNCED_BLOCK_ENDPOINTS } from './reusable-content.endpoints'
import type { SyncedBlock } from '../model/reusable-content'

export async function listSyncedBlocks(workspaceId: string): Promise<{ items: SyncedBlock[] }> {
  const res = await apiClient.get<ListPayload<SyncedBlock>>(SYNCED_BLOCK_ENDPOINTS.list(workspaceId))
  return normalizeItemList(res)
}

export async function getSyncedBlock(
  workspaceId: string,
  syncedBlockId: string
): Promise<SyncedBlock> {
  return apiClient.get(SYNCED_BLOCK_ENDPOINTS.get(workspaceId, syncedBlockId))
}

export async function createSyncedBlock(
  workspaceId: string,
  projectId: string,
  body: { title: string; ast: string; schemaVersion?: number }
): Promise<SyncedBlock> {
  return apiClient.post(SYNCED_BLOCK_ENDPOINTS.create(workspaceId, projectId), body)
}

export async function updateSyncedBlock(
  workspaceId: string,
  syncedBlockId: string,
  body: { ast: string; schemaVersion?: number }
): Promise<SyncedBlock> {
  return apiClient.put(SYNCED_BLOCK_ENDPOINTS.update(workspaceId, syncedBlockId), body)
}

export async function archiveSyncedBlock(
  workspaceId: string,
  syncedBlockId: string
): Promise<SyncedBlock> {
  return apiClient.post(SYNCED_BLOCK_ENDPOINTS.archive(workspaceId, syncedBlockId), {})
}
