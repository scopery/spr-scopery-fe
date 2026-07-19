import { apiClient } from '@/shared/lib/apiClient'
import { RAID_ACTION_ENDPOINTS } from './endpoints'
import type { CreateRaidActionPayload, RaidAction, UpdateRaidActionPayload } from '../../domain/model/raid-action'

export async function listRaidActions(
  projectId: string,
  raidItemId: string
): Promise<RaidAction[]> {
  return apiClient.get<RaidAction[]>(RAID_ACTION_ENDPOINTS.list(projectId, raidItemId))
}

export async function createRaidAction(
  projectId: string,
  raidItemId: string,
  body: CreateRaidActionPayload
): Promise<RaidAction> {
  return apiClient.post<RaidAction>(RAID_ACTION_ENDPOINTS.create(projectId, raidItemId), body)
}

export async function getRaidAction(
  projectId: string,
  raidActionId: string
): Promise<RaidAction> {
  return apiClient.get<RaidAction>(RAID_ACTION_ENDPOINTS.get(projectId, raidActionId))
}

export async function updateRaidAction(
  projectId: string,
  raidActionId: string,
  body: UpdateRaidActionPayload
): Promise<RaidAction> {
  return apiClient.patch<RaidAction>(RAID_ACTION_ENDPOINTS.update(projectId, raidActionId), body)
}

export async function completeRaidAction(
  projectId: string,
  raidActionId: string
): Promise<RaidAction> {
  return apiClient.post<RaidAction>(RAID_ACTION_ENDPOINTS.complete(projectId, raidActionId))
}

export async function cancelRaidAction(
  projectId: string,
  raidActionId: string
): Promise<RaidAction> {
  return apiClient.post<RaidAction>(RAID_ACTION_ENDPOINTS.cancel(projectId, raidActionId))
}

export async function createLinkedTaskFromRaidAction(
  projectId: string,
  raidActionId: string,
  body?: { title?: string }
): Promise<{ taskId: string }> {
  return apiClient.post<{ taskId: string }>(
    RAID_ACTION_ENDPOINTS.createLinkedTask(projectId, raidActionId),
    body
  )
}
