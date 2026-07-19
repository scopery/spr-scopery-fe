export const OrgMemberStatus = {
  Active: 'ACTIVE',
  Suspended: 'SUSPENDED',
  Removed: 'REMOVED',
} as const
export type OrgMemberStatus = (typeof OrgMemberStatus)[keyof typeof OrgMemberStatus]

export const OrgMembershipType = {
  Owner: 'OWNER',
  Member: 'MEMBER',
} as const
export type OrgMembershipType = (typeof OrgMembershipType)[keyof typeof OrgMembershipType]

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  membershipType: OrgMembershipType | string
  status: OrgMemberStatus | string
  source: string
  joinedAt: string
  suspendedAt: string | null
  removedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface AddOrganizationMemberPayload {
  userId: string
  membershipType?: string
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
