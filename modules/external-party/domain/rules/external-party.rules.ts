import type { ExternalContact } from '../model/external-contact'
import type { ExternalOrganization } from '../model/external-organization'
import { ExternalPartyStatus } from '../enums/external-party.enum'

export function isExternalOrganizationActive(org: ExternalOrganization): boolean {
  return org.status === ExternalPartyStatus.Active
}

export function isPrimaryContact(contact: ExternalContact): boolean {
  return contact.primaryFlag === true
}

export function contactDisplayName(contact: ExternalContact): string {
  return `${contact.firstName} ${contact.lastName}`.trim()
}
