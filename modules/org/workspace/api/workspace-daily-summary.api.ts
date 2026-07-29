import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_ENDPOINTS } from './endpoints'
import type { WorkspaceDailySummary } from '../model/workspace-daily-summary'

export async function getWorkspaceDailySummary(
  workspaceId: string,
  date?: string
): Promise<WorkspaceDailySummary> {
  return apiClient.get<WorkspaceDailySummary>(
    WORKSPACE_ENDPOINTS.dailySummary(workspaceId, date)
  )
}
