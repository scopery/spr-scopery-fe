import { apiPath } from '@/shared/lib/api-paths'

export const MEMBER_PERMISSIONS_ENDPOINTS = {
  workspaceCatalog: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/member-permissions`),
  workspaceMember: (workspaceId: string, userId: string) =>
    apiPath(`/workspaces/${workspaceId}/members/by-user/${userId}/permissions`),
  organizationCatalog: (organizationId: string) =>
    apiPath(`/organizations/${organizationId}/member-permissions`),
  organizationMember: (organizationId: string, userId: string) =>
    apiPath(`/organizations/${organizationId}/members/by-user/${userId}/permissions`),
  projectCatalog: (projectId: string) =>
    apiPath(`/projects/${projectId}/member-permissions`),
  projectMember: (projectId: string, userId: string) =>
    apiPath(`/projects/${projectId}/members/by-user/${userId}/permissions`),
} as const
