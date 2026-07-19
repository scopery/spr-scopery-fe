import type {
  ExecutionLogStatus,
  ExecutionRunStatus,
  ExecutionTriggerSource,
} from '../enums/execution.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'
import type { EventConfigEnvironment } from '../../../event-configs/domain/enums/event-config.enum'

export interface ExecuteByEventPayload {
  requestId?: string | null
  eventDefinitionId?: string | null
  eventCode?: string | null
  sourceSystem?: string | null
  eventKey?: string | null
  environment?: EventConfigEnvironment | null
  triggerSource?: ExecutionTriggerSource | null
  inputVariables?: Record<string, unknown>
}

export interface ExecuteByEventConfigPayload {
  requestId?: string | null
  inputVariables?: Record<string, unknown>
}

export interface AiExecutionRunResult {
  executionId: string
  requestId: string
  eventConfigId: string
  status: ExecutionRunStatus
  output: string | null
  errorCode: string | null
  errorMessage: string | null
  inputTokenCount: number | null
  outputTokenCount: number | null
  totalTokenCount: number | null
  estimatedCost: string | null
  durationMs: number | null
}

export interface AiExecutionLog {
  id: string
  requestId: string
  eventConfigId: string | null
  eventDefinitionId: string | null
  agentId: string | null
  promptVersionId: string | null
  modelDeploymentId: string | null
  triggerSource: ExecutionTriggerSource | null
  status: ExecutionLogStatus
  inputVariables?: Record<string, unknown> | null
  output?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  inputTokenCount?: number | null
  outputTokenCount?: number | null
  totalTokenCount?: number | null
  estimatedCost?: string | null
  durationMs?: number | null
  createdAt: string
  updatedAt?: string
}

export interface SearchAiExecutionLogsParams {
  requestId?: string
  eventConfigId?: string
  eventDefinitionId?: string
  agentId?: string
  promptVersionId?: string
  modelDeploymentId?: string
  triggerSource?: ExecutionTriggerSource | ''
  status?: ExecutionLogStatus | ''
  createdFrom?: string
  createdTo?: string
  page?: number
  size?: number
}

export type AiExecutionLogPage = AiAdminPage<AiExecutionLog>
