export interface IamMeOrganizationMembership {
  organizationId: string
  organizationName: string
  membershipType: string
  status: string
}

export interface IamMeSecurityState {
  mfaEnabled: boolean
  passwordChangeRequired: boolean
}

export interface IamMe {
  id: string
  username: string
  email: string
  fullName: string
  status: string
  organizationMemberships: IamMeOrganizationMembership[]
  securityState: IamMeSecurityState
  createdAt: string
}
