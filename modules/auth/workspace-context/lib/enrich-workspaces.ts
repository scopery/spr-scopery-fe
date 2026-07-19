import { getOrganization } from '@/modules/org/organization'
import type { AvailableWorkspace, WorkspaceListItem } from '../model'

export async function enrichWorkspacesWithOrgNames(
  workspaces: AvailableWorkspace[]
): Promise<WorkspaceListItem[]> {
  const uniqueOrgIds = [...new Set(workspaces.map((w) => w.organizationId))]
  const orgNameById = new Map<string, string | null>()

  await Promise.allSettled(
    uniqueOrgIds.map(async (orgId) => {
      try {
        const org = await getOrganization(orgId)
        orgNameById.set(orgId, org.name)
      } catch {
        orgNameById.set(orgId, null)
      }
    })
  )

  return workspaces.map((workspace) => ({
    ...workspace,
    organizationName: orgNameById.get(workspace.organizationId) ?? null,
  }))
}
