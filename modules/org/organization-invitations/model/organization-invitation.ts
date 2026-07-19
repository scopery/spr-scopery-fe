export const OrgInvitationStatus = {
  Pending: 'PENDING',
  Accepted: 'ACCEPTED',
  Cancelled: 'CANCELLED',
  Expired: 'EXPIRED',
} as const
export type OrgInvitationStatus = (typeof OrgInvitationStatus)[keyof typeof OrgInvitationStatus]

export interface OrganizationInvitation {
  id: string
  organizationId: string
  inviteeEmail: string
  inviteeUserId: string | null
  membershipType: string
  status: OrgInvitationStatus | string
  invitedBy: string
  token: string | null
  tokenHint: string | null
  expiresAt: string | null
  respondedAt: string | null
  createdAt: string
}

export interface CreateOrganizationInvitationPayload {
  inviteeEmail: string
  membershipType?: string
  expiresAt?: string
}

/** Locally tracked invite after create (BE has no list endpoint). */
export interface MyOrgInvitationRecord {
  id: string
  organizationId: string
  inviteeEmail: string
  membershipType: string
  status: string
  tokenHint: string | null
  /** Raw token only when just created — cleared after dismiss. */
  token?: string | null
  expiresAt: string | null
  createdAt: string
}
