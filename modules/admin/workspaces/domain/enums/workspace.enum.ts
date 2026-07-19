export const WorkspaceStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Archived: 'ARCHIVED',
} as const
export type WorkspaceStatus = (typeof WorkspaceStatus)[keyof typeof WorkspaceStatus]

export const WorkspaceVisibility = {
  Private: 'PRIVATE',
  Public: 'PUBLIC',
} as const
export type WorkspaceVisibility = (typeof WorkspaceVisibility)[keyof typeof WorkspaceVisibility]

export const WorkspaceJoinPolicy = {
  InviteOnly: 'INVITE_ONLY',
  RequestToJoin: 'REQUEST_TO_JOIN',
  InviteOrRequest: 'INVITE_OR_REQUEST',
  Disabled: 'DISABLED',
} as const
export type WorkspaceJoinPolicy = (typeof WorkspaceJoinPolicy)[keyof typeof WorkspaceJoinPolicy]

export const InvitationStatus = {
  Pending: 'PENDING',
  Accepted: 'ACCEPTED',
  Expired: 'EXPIRED',
  Revoked: 'REVOKED',
} as const
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus]
