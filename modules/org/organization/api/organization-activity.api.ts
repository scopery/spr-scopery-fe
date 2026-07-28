import { apiClient } from '@/shared/lib/apiClient'
import { ORGANIZATION_ENDPOINTS } from './endpoints'
import type { WorkspaceActivityFeedPage } from '@/modules/org/workspace/model/workspace-activity'

export async function listOrganizationActivityFeed(
  organizationId: string,
  params?: { page?: number; size?: number }
): Promise<WorkspaceActivityFeedPage> {
  return apiClient.get<WorkspaceActivityFeedPage>(
    ORGANIZATION_ENDPOINTS.activityFeed(organizationId, params),
    { skipErrorToast: true }
  )
}
