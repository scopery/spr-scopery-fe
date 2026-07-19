import type { ExternalOrganizationType, ExternalPartyStatus } from '../enums/external-party.enum'

export interface ExternalOrganization {
  id: string
  workspaceId: string
  code: string
  name: string
  organizationType: ExternalOrganizationType | string
  status: ExternalPartyStatus | string
  createdAt: string
}

export interface CreateExternalOrganizationPayload {
  code: string
  name: string
  organizationType?: string
}
