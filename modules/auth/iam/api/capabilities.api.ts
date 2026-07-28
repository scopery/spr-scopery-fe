import { apiClient } from '@/shared/lib/apiClient'
import { apiPath } from '@/shared/lib/api-paths'
import type { CapabilitiesResponse, NavCapabilityPack } from '../model/nav-capabilities'

export async function getWorkspaceCapabilities(
  workspaceId: string,
  pack: NavCapabilityPack,
  opts?: { projectId?: string | null }
): Promise<CapabilitiesResponse> {
  const params = new URLSearchParams({ pack })
  if (opts?.projectId) params.set('projectId', opts.projectId)
  return apiClient.get<CapabilitiesResponse>(
    `${apiPath(`/workspaces/${workspaceId}/capabilities`)}?${params.toString()}`
  )
}

export async function getOrganizationCapabilities(
  organizationId: string,
  pack: NavCapabilityPack
): Promise<CapabilitiesResponse> {
  return apiClient.get<CapabilitiesResponse>(
    `${apiPath(`/organizations/${organizationId}/capabilities`)}?pack=${encodeURIComponent(pack)}`
  )
}
