import type { OrganizationStatus } from '../enums/organization.enum'

export interface Organization {
  id: string
  name: string
  code: string
  description: string | null
  ownerUserId: string | null
  status: OrganizationStatus
  version?: number
  createdAt: string
  updatedAt: string
}

export interface CreateOrganizationPayload {
  name: string
  code: string
  description?: string
}

export interface UpdateOrganizationPayload {
  name: string
  description?: string
}

export interface SearchOrganizationsParams {
  keyword?: string
  ownerUserId?: string
  status?: OrganizationStatus
  page?: number
  size?: number
}
