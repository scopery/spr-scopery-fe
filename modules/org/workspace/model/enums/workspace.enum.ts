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
