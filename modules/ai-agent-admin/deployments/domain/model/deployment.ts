import type {
  DeploymentEnvironment,
  DeploymentStatus,
} from '../enums/deployment.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'

export interface AiModelDeployment {
  id: string
  modelId: string
  name: string
  code: string
  environment: DeploymentEnvironment
  providerDeploymentId: string | null
  endpointUrl: string | null
  defaultTemperature: number | null
  defaultMaxOutputTokens: number | null
  isDefault: boolean
  status: DeploymentStatus
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAiModelDeploymentPayload {
  modelId: string
  name: string
  code: string
  environment: DeploymentEnvironment
  providerDeploymentId?: string | null
  endpointUrl?: string | null
  defaultTemperature?: number | null
  defaultMaxOutputTokens?: number | null
  isDefault?: boolean | null
  description?: string | null
}

export interface UpdateAiModelDeploymentPayload {
  name: string
  providerDeploymentId?: string | null
  endpointUrl?: string | null
  defaultTemperature?: number | null
  defaultMaxOutputTokens?: number | null
  description?: string | null
}

export interface SearchAiModelDeploymentsParams {
  modelId?: string
  environment?: DeploymentEnvironment | ''
  keyword?: string
  status?: DeploymentStatus | ''
  isDefault?: boolean | ''
  page?: number
  size?: number
}

export type AiModelDeploymentPage = AiAdminPage<AiModelDeployment>
