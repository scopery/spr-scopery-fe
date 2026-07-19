import type {
  AgentAutonomyLevel,
  AgentOutputFormat,
  AgentScope,
  AgentStatus,
  AgentType,
} from '../enums/agent.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'

export interface AiAgent {
  id: string
  name: string
  code: string
  type: AgentType
  status: AgentStatus
  description: string | null
  defaultModelDeploymentId: string | null
  outputFormat: AgentOutputFormat | null
  autonomyLevel: AgentAutonomyLevel | null
  scope: AgentScope | null
  organizationId: string | null
  workspaceId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAiAgentPayload {
  name: string
  code: string
  type: AgentType
  description?: string | null
  defaultModelDeploymentId?: string | null
  outputFormat?: AgentOutputFormat | null
  autonomyLevel?: AgentAutonomyLevel | null
  scope?: AgentScope | null
  organizationId?: string | null
  workspaceId?: string | null
}

export type UpdateAiAgentPayload = Omit<CreateAiAgentPayload, 'code'> & {
  name: string
  type: AgentType
}

export interface SearchAiAgentsParams {
  keyword?: string
  type?: AgentType | ''
  status?: AgentStatus | ''
  outputFormat?: AgentOutputFormat | ''
  page?: number
  size?: number
}

export type AiAgentPage = AiAdminPage<AiAgent>
