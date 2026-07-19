import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AiExecutionLog,
  AiExecutionLogPage,
  AiExecutionRunResult,
  ExecuteByEventConfigPayload,
  ExecuteByEventPayload,
  SearchAiExecutionLogsParams,
} from '../../domain/model/execution'

/** UI-facing execution triggers only (#78–79). */
export async function executeByEvent(
  body: ExecuteByEventPayload
): Promise<AiExecutionRunResult> {
  return apiClient.post<AiExecutionRunResult>(
    AI_AGENT_ADMIN_ENDPOINTS.executeByEvent(),
    body
  )
}

export async function executeByEventConfig(
  eventConfigId: string,
  body?: ExecuteByEventConfigPayload
): Promise<AiExecutionRunResult> {
  return apiClient.post<AiExecutionRunResult>(
    AI_AGENT_ADMIN_ENDPOINTS.executeByEventConfig(eventConfigId),
    body ?? {}
  )
}

/** GET-only execution logs (#85–86). No transition mutations. */
export async function listExecutionLogs(
  params?: SearchAiExecutionLogsParams
): Promise<AiExecutionLogPage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.executionLogs(params))
  return normalizeAiAdminPage<AiExecutionLog>(res)
}

export async function getExecutionLog(id: string): Promise<AiExecutionLog> {
  return apiClient.get<AiExecutionLog>(AI_AGENT_ADMIN_ENDPOINTS.executionLog(id))
}
