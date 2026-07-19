import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_ENDPOINTS } from './endpoints'
import type { UpdateWorkspacePayload, WorkspaceDetail } from '../model'

export async function getWorkspace(workspaceId: string): Promise<WorkspaceDetail> {
  return apiClient.get<WorkspaceDetail>(WORKSPACE_ENDPOINTS.get(workspaceId))
}

export async function updateWorkspace(
  workspaceId: string,
  body: UpdateWorkspacePayload
): Promise<WorkspaceDetail> {
  return apiClient.put<WorkspaceDetail>(WORKSPACE_ENDPOINTS.update(workspaceId), body)
}
