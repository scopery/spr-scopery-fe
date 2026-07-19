import type {
  UsagePolicyAction,
  UsagePolicyPeriod,
  UsagePolicyStatus,
  UsagePolicyTargetType,
} from '../enums/usage-policy.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'

export interface AiUsagePolicy {
  id: string
  code: string
  name: string
  targetType: UsagePolicyTargetType
  targetId: string | null
  maxRequestsPerPeriod: number | null
  maxTokensPerPeriod: number | null
  maxCostPerPeriod: number | null
  maxConcurrentRequests: number | null
  dailyBudget: number | null
  period: UsagePolicyPeriod | null
  action: UsagePolicyAction | null
  priority: number | null
  description: string | null
  status: UsagePolicyStatus
  createdAt: string
  updatedAt: string
}

export interface CreateAiUsagePolicyPayload {
  code: string
  name: string
  targetType: UsagePolicyTargetType
  targetId?: string | null
  maxRequestsPerPeriod?: number | null
  maxTokensPerPeriod?: number | null
  maxCostPerPeriod?: number | null
  maxConcurrentRequests?: number | null
  dailyBudget?: number | null
  period?: UsagePolicyPeriod | null
  action?: UsagePolicyAction | null
  priority?: number | null
  description?: string | null
}

export type UpdateAiUsagePolicyPayload = Omit<CreateAiUsagePolicyPayload, 'code'> & {
  name: string
  targetType: UsagePolicyTargetType
}

export interface SearchAiUsagePoliciesParams {
  keyword?: string
  targetType?: UsagePolicyTargetType | ''
  status?: UsagePolicyStatus | ''
  page?: number
  size?: number
}

export type AiUsagePolicyPage = AiAdminPage<AiUsagePolicy>
