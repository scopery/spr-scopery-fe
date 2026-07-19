import type { PageParams } from './common'
import type { CompoundFrequency, RateCardEntityStatus, RateCardScope } from '../enums/rate-card.enum'

export interface InflationPolicy {
  id: string
  code: string
  name: string
  description: string | null
  scope: RateCardScope | string
  organizationId: string | null
  workspaceId: string | null
  inflationPercent: number
  compoundFrequency: CompoundFrequency | string
  effectiveFrom: string
  effectiveTo: string | null
  status: RateCardEntityStatus | string
  archivedAt: string | null
  archivedBy: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateInflationPolicyPayload {
  code: string
  name: string
  description?: string
  scope: string
  organizationId?: string
  workspaceId?: string
  inflationPercent: number
  compoundFrequency: string
  effectiveFrom: string
  effectiveTo?: string
}

export interface UpdateInflationPolicyPayload {
  name: string
  description?: string
  inflationPercent: number
  compoundFrequency: string
  effectiveFrom: string
  effectiveTo?: string | null
}

export interface InflationPolicySearchParams extends PageParams {
  scope?: string
  organizationId?: string
  workspaceId?: string
  status?: string
  code?: string
}
