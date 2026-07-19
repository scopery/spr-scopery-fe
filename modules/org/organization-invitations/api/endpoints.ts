import { apiPath } from '@/shared/lib/api-paths'

export const ORGANIZATION_INVITATION_ENDPOINTS = {
  create: (organizationId: string) =>
    apiPath(`/organizations/${organizationId}/invitations`),
  get: (organizationId: string, invitationId: string) =>
    apiPath(`/organizations/${organizationId}/invitations/${invitationId}`),
  cancel: (organizationId: string, invitationId: string) =>
    apiPath(`/organizations/${organizationId}/invitations/${invitationId}`),
  accept: (token: string) => apiPath(`/org-invitations/${encodeURIComponent(token)}/accept`),
} as const
