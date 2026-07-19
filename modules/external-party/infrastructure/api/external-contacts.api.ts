import { apiClient } from '@/shared/lib/apiClient'
import { EXTERNAL_PARTY_ENDPOINTS } from './endpoints'
import type {
  CreateExternalContactPayload,
  ExternalContact,
} from '../../domain/model/external-contact'

export async function listExternalContacts(workspaceId: string): Promise<ExternalContact[]> {
  return apiClient.get<ExternalContact[]>(EXTERNAL_PARTY_ENDPOINTS.contacts.list(workspaceId))
}

export async function getExternalContact(
  workspaceId: string,
  contactId: string
): Promise<ExternalContact> {
  return apiClient.get<ExternalContact>(
    EXTERNAL_PARTY_ENDPOINTS.contacts.get(workspaceId, contactId)
  )
}

export async function createExternalContact(
  workspaceId: string,
  body: CreateExternalContactPayload
): Promise<ExternalContact> {
  return apiClient.post<ExternalContact>(
    EXTERNAL_PARTY_ENDPOINTS.contacts.create(workspaceId),
    body
  )
}
