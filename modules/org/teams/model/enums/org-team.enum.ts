export const OrgTeamStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type OrgTeamStatus = (typeof OrgTeamStatus)[keyof typeof OrgTeamStatus]

export const OrgTeamAssignmentStatus = {
  Active: 'ACTIVE',
  Revoked: 'REVOKED',
} as const
export type OrgTeamAssignmentStatus =
  (typeof OrgTeamAssignmentStatus)[keyof typeof OrgTeamAssignmentStatus]
