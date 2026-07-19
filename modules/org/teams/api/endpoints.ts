import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const ORG_TEAM_ENDPOINTS = {
  create: (organizationId: string) => apiPath(`/organizations/${organizationId}/teams`),
  get: (organizationId: string, teamId: string) =>
    apiPath(`/organizations/${organizationId}/teams/${teamId}`),
  search: (
    organizationId: string,
    params?: { keyword?: string; status?: string; page?: number; size?: number }
  ) =>
    withQuery(
      apiPath(`/organizations/${organizationId}/teams`),
      params as Record<string, string | number | boolean | undefined>
    ),
  update: (organizationId: string, teamId: string) =>
    apiPath(`/organizations/${organizationId}/teams/${teamId}`),
  activate: (organizationId: string, teamId: string) =>
    apiPath(`/organizations/${organizationId}/teams/${teamId}/activate`),
  archive: (organizationId: string, teamId: string) =>
    apiPath(`/organizations/${organizationId}/teams/${teamId}/archive`),
  addMember: (organizationId: string, teamId: string) =>
    apiPath(`/organizations/${organizationId}/teams/${teamId}/members`),
  listMembers: (organizationId: string, teamId: string, params?: { page?: number; size?: number }) =>
    withQuery(
      apiPath(`/organizations/${organizationId}/teams/${teamId}/members`),
      params as Record<string, string | number | boolean | undefined>
    ),
  removeMember: (organizationId: string, teamId: string, userId: string) =>
    apiPath(`/organizations/${organizationId}/teams/${teamId}/members/${userId}`),
  assignWorkspace: (organizationId: string, teamId: string) =>
    apiPath(`/organizations/${organizationId}/teams/${teamId}/workspace-assignments`),
  listWorkspaceAssignments: (
    organizationId: string,
    teamId: string,
    params?: { page?: number; size?: number }
  ) =>
    withQuery(
      apiPath(`/organizations/${organizationId}/teams/${teamId}/workspace-assignments`),
      params as Record<string, string | number | boolean | undefined>
    ),
  revokeWorkspaceAssignment: (organizationId: string, teamId: string, assignmentId: string) =>
    apiPath(
      `/organizations/${organizationId}/teams/${teamId}/workspace-assignments/${assignmentId}`),
} as const
