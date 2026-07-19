export const OrganizationStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Archived: 'ARCHIVED',
} as const
export type OrganizationStatus = (typeof OrganizationStatus)[keyof typeof OrganizationStatus]
