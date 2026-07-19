import type { PageParams } from './common'
import type { RateCardScope, RateCardStatus } from '../enums/rate-card.enum'

export interface RateCard {
  id: string
  code: string
  name: string
  description: string | null
  scope: RateCardScope | string
  organizationId: string | null
  workspaceId: string | null
  defaultCurrencyCode: string
  isDefault: boolean
  status: RateCardStatus | string
  currentVersionId: string | null
  builtIn: boolean
  archivedAt: string | null
  archivedBy: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateRateCardPayload {
  code: string
  name: string
  description?: string
  scope: string
  organizationId?: string
  workspaceId?: string
  clientId?: string
  projectId?: string
  defaultCurrencyCode: string
  isDefault?: boolean
}

export interface UpdateRateCardPayload {
  name: string
  description?: string
  defaultCurrencyCode: string
}

export interface RateCardSearchParams extends PageParams {
  scope?: string
  organizationId?: string
  workspaceId?: string
  status?: string
  currency?: string
  code?: string
}
