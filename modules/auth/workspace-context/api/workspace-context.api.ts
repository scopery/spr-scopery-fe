import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_CONTEXT_ENDPOINTS } from './endpoints'
import type { AvailableWorkspace, WorkspaceContextResponse } from '../model'

export async function getWorkspaceContext(): Promise<WorkspaceContextResponse> {
  return apiClient.get<WorkspaceContextResponse>(WORKSPACE_CONTEXT_ENDPOINTS.current())
}

export async function listAvailableWorkspaces(): Promise<AvailableWorkspace[]> {
  return apiClient.get<AvailableWorkspace[]>(WORKSPACE_CONTEXT_ENDPOINTS.available())
}

export async function switchWorkspace(workspaceId: string): Promise<WorkspaceContextResponse> {
  return apiClient.put<WorkspaceContextResponse>(WORKSPACE_CONTEXT_ENDPOINTS.switch(), {
    workspaceId,
  })
}
