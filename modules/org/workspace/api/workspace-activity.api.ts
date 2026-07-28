import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_ENDPOINTS } from './endpoints'
import type { WorkspaceActivityFeedPage } from '../model/workspace-activity'

export async function listWorkspaceActivityFeed(
  workspaceId: string,
  params?: { page?: number; size?: number }
): Promise<WorkspaceActivityFeedPage> {
  return apiClient.get<WorkspaceActivityFeedPage>(
    WORKSPACE_ENDPOINTS.activityFeed(workspaceId, params),
    { skipErrorToast: true }
  )
}
