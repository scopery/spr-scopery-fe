export {
  ExternalOrganizationType,
  ExternalPartyStatus,
} from './domain/enums/external-party.enum'
export type {
  ExternalOrganizationType as ExternalOrganizationTypeValue,
  ExternalPartyStatus as ExternalPartyStatusValue,
} from './domain/enums/external-party.enum'
export type {
  ExternalOrganization,
  CreateExternalOrganizationPayload,
} from './domain/model/external-organization'
export type {
  ExternalContact,
  CreateExternalContactPayload,
} from './domain/model/external-contact'
export {
  isExternalOrganizationActive,
  isPrimaryContact,
  contactDisplayName,
} from './domain/rules/external-party.rules'
export * as externalOrganizationsApi from './infrastructure/api/external-organizations.api'
export * as externalContactsApi from './infrastructure/api/external-contacts.api'
export { useClientsContacts } from './presentation/hooks/useClientsContacts'
export {
  ClientsContactsView,
  AdminClientsContactsView,
} from './presentation/ui/ClientsContactsView'
