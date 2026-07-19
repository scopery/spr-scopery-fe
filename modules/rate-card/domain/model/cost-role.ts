import type { PageParams } from './common'
import type { RateCardEntityStatus, RateCardScope } from '../enums/rate-card.enum'

export interface CostRole {
  id: string
  code: string
  name: string
  description: string | null
  scope: RateCardScope | string
  organizationId: string | null
  workspaceId: string | null
  category: string | null
  builtIn: boolean
  status: RateCardEntityStatus | string
  archivedAt: string | null
  archivedBy: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateCostRolePayload {
  code: string
  name: string
  description?: string
  scope: string
  organizationId?: string
  workspaceId?: string
  category?: string
}

export interface UpdateCostRolePayload {
  name: string
  description?: string
  category?: string
}

export interface CostRoleSearchParams extends PageParams {
  scope?: string
  organizationId?: string
  workspaceId?: string
  status?: string
  category?: string
  code?: string
}
