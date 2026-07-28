import { apiPath } from '@/shared/lib/api-paths'

/**
 * Workspace Invitations (v1)
 * Description: Create and manage workspace invitation codes for new members.
 */
export const WORKSPACE_INVITATION_ENDPOINTS = {
  list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/invitations`),
  create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/invitations`),
  revoke: (workspaceId: string, invitationId: string) =>
    apiPath(`/workspaces/${workspaceId}/invitations/${invitationId}/revoke`),
  acceptByCode: (code: string) => apiPath(`/workspaces/invitations/${encodeURIComponent(code)}/accept`),
  acceptById: (id: string) => apiPath(`/me/workspace-invitations/${id}/accept`),
} as const
