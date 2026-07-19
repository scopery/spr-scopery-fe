import { apiPath } from '@/shared/lib/api-paths'

export const EXTERNAL_PARTY_ENDPOINTS = {
  organizations: {
    list: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/external-organizations`),
    get: (workspaceId: string, organizationId: string) =>
      apiPath(`/workspaces/${workspaceId}/external-organizations/${organizationId}`),
    create: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/external-organizations`),
  },
  contacts: {
    list: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/external-contacts`),
    get: (workspaceId: string, contactId: string) =>
      apiPath(`/workspaces/${workspaceId}/external-contacts/${contactId}`),
    create: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/external-contacts`),
  },
} as const
