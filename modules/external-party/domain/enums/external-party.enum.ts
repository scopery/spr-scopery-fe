export const ExternalOrganizationType = {
  Client: 'CLIENT',
  Vendor: 'VENDOR',
  Other: 'OTHER',
} as const
export type ExternalOrganizationType =
  (typeof ExternalOrganizationType)[keyof typeof ExternalOrganizationType]

export const ExternalPartyStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const
export type ExternalPartyStatus = (typeof ExternalPartyStatus)[keyof typeof ExternalPartyStatus]
