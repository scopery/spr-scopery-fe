import { apiClient } from '@/shared/lib/apiClient'
import { RAID_ENDPOINTS } from './endpoints'
import type {
  ChangeRaidItemStatusPayload,
  CreateRaidItemPayload,
  EscalateRaidItemPayload,
  RaidItem,
  ResolveRaidItemPayload,
  UpdateRaidItemPayload,
} from '../../domain/model/raid'

export async function listRaidItems(
  projectId: string,
  params?: { type?: string }
): Promise<RaidItem[]> {
  return apiClient.get<RaidItem[]>(RAID_ENDPOINTS.list(projectId, params))
}

export async function createRaidItem(
  projectId: string,
  body: CreateRaidItemPayload
): Promise<RaidItem> {
  return apiClient.post<RaidItem>(RAID_ENDPOINTS.create(projectId), body)
}

export async function getRaidItem(projectId: string, raidItemId: string): Promise<RaidItem> {
  return apiClient.get<RaidItem>(RAID_ENDPOINTS.get(projectId, raidItemId))
}

export async function updateRaidItem(
  projectId: string,
  raidItemId: string,
  body: UpdateRaidItemPayload
): Promise<RaidItem> {
  return apiClient.put<RaidItem>(RAID_ENDPOINTS.update(projectId, raidItemId), body)
}

export async function changeRaidItemStatus(
  projectId: string,
  raidItemId: string,
  body: ChangeRaidItemStatusPayload
): Promise<RaidItem> {
  return apiClient.patch<RaidItem>(RAID_ENDPOINTS.changeStatus(projectId, raidItemId), body)
}

export async function resolveRaidItem(
  projectId: string,
  raidItemId: string,
  body?: ResolveRaidItemPayload
): Promise<RaidItem> {
  return apiClient.post<RaidItem>(RAID_ENDPOINTS.resolve(projectId, raidItemId), body)
}

export async function closeRaidItem(projectId: string, raidItemId: string): Promise<RaidItem> {
  return apiClient.post<RaidItem>(RAID_ENDPOINTS.close(projectId, raidItemId))
}

export async function reopenRaidItem(projectId: string, raidItemId: string): Promise<RaidItem> {
  return apiClient.post<RaidItem>(RAID_ENDPOINTS.reopen(projectId, raidItemId))
}

export async function escalateRaidItem(
  projectId: string,
  raidItemId: string,
  body?: EscalateRaidItemPayload
): Promise<RaidItem> {
  return apiClient.post<RaidItem>(RAID_ENDPOINTS.escalate(projectId, raidItemId), body)
}

export async function archiveRaidItem(projectId: string, raidItemId: string): Promise<RaidItem> {
  return apiClient.patch<RaidItem>(RAID_ENDPOINTS.archive(projectId, raidItemId))
}

export async function convertRiskToIssue(
  projectId: string,
  raidItemId: string,
  body?: Record<string, unknown>
): Promise<RaidItem> {
  return apiClient.post<RaidItem>(RAID_ENDPOINTS.convertToIssue(projectId, raidItemId), body)
}

export async function createChangeRequestDraft(
  projectId: string,
  raidItemId: string,
  body?: Record<string, unknown>
): Promise<{ changeRequestId: string }> {
  return apiClient.post<{ changeRequestId: string }>(
    RAID_ENDPOINTS.createCRDraft(projectId, raidItemId),
    body
  )
}
