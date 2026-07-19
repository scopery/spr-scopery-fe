export interface RateCardLine {
  id: string
  rateCardVersionId: string
  costRoleId: string
  seniorityLevel: string | null
  locationCode: string | null
  currencyCode: string
  costRatePerHour: number
  billingRatePerHour: number | null
  notes: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateRateCardLinePayload {
  costRoleId: string
  seniorityLevel?: string
  locationCode?: string
  currencyCode: string
  costRatePerHour: number
  billingRatePerHour?: number
  notes?: string
}

export type UpdateRateCardLinePayload = CreateRateCardLinePayload
