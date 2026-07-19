import type { RateCardVersionStatus } from '../enums/rate-card.enum'

export interface RateCardVersion {
  id: string
  rateCardId: string
  versionNumber: number
  name: string | null
  description: string | null
  effectiveFrom: string
  effectiveTo: string | null
  status: RateCardVersionStatus | string
  publishedAt: string | null
  publishedBy: string | null
  archivedAt: string | null
  archivedBy: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateRateCardVersionPayload {
  name?: string
  description?: string
  effectiveFrom: string
  effectiveTo?: string
}

export interface UpdateRateCardVersionPayload {
  name?: string
  description?: string
  effectiveFrom: string
  effectiveTo?: string
}
