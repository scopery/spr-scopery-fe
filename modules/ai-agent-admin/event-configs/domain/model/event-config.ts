import type {
  EventConfigEnvironment,
  EventConfigStatus,
  EventTriggerType,
} from '../enums/event-config.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'

export interface AiEventConfig {
  id: string
  code: string
  name: string
  eventDefinitionId: string
  environment: EventConfigEnvironment
  triggerType: EventTriggerType
  agentId: string | null
  promptVersionId: string | null
  modelDeploymentId: string | null
  conditionExpression: string | null
  description: string | null
  status: EventConfigStatus
  createdAt: string
  updatedAt: string
}

export interface CreateAiEventConfigPayload {
  code: string
  name: string
  eventDefinitionId: string
  environment: EventConfigEnvironment
  triggerType: EventTriggerType
  agentId?: string | null
  promptVersionId?: string | null
  modelDeploymentId?: string | null
  conditionExpression?: string | null
  description?: string | null
}

export type UpdateAiEventConfigPayload = Omit<CreateAiEventConfigPayload, 'code'> & {
  name: string
  eventDefinitionId: string
  environment: EventConfigEnvironment
  triggerType: EventTriggerType
}

export interface SearchAiEventConfigsParams {
  keyword?: string
  eventDefinitionId?: string
  environment?: EventConfigEnvironment | ''
  triggerType?: EventTriggerType | ''
  status?: EventConfigStatus | ''
  agentId?: string
  page?: number
  size?: number
}

export interface ResolveEventConfigParams {
  eventDefinitionId?: string
  sourceSystem?: string
  eventKey?: string
  environment?: EventConfigEnvironment | ''
}

export type AiEventConfigPage = AiAdminPage<AiEventConfig>
