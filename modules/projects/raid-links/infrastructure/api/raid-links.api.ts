import { apiClient } from '@/shared/lib/apiClient'
import { RAID_LINK_ENDPOINTS } from './endpoints'
import type { CreateRaidLinkPayload, RaidLink } from '../../domain/model/raid-link'

export async function listRaidLinks(
  projectId: string,
  raidItemId: string
): Promise<RaidLink[]> {
  return apiClient.get<RaidLink[]>(RAID_LINK_ENDPOINTS.list(projectId, raidItemId))
}

export async function createRaidLink(
  projectId: string,
  raidItemId: string,
  body: CreateRaidLinkPayload
): Promise<RaidLink> {
  return apiClient.post<RaidLink>(RAID_LINK_ENDPOINTS.create(projectId, raidItemId), body)
}

export async function deleteRaidLink(
  projectId: string,
  raidItemId: string,
  linkId: string
): Promise<void> {
  await apiClient.delete<void>(RAID_LINK_ENDPOINTS.delete(projectId, raidItemId, linkId), {
    parseJson: false,
  })
}
