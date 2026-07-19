import type { ExternalPartyStatus } from '../enums/external-party.enum'

export interface ExternalContact {
  id: string
  workspaceId: string
  organizationId: string | null
  firstName: string
  lastName: string
  email: string | null
  status: ExternalPartyStatus | string
  primaryFlag: boolean
  createdAt: string
}

export interface CreateExternalContactPayload {
  organizationId?: string
  firstName: string
  lastName: string
  email?: string
  primaryFlag?: boolean
}
