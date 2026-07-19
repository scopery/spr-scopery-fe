import { apiPath } from '@/shared/lib/api-paths'
import type { SearchWorkspacesParams } from '../../domain/model/workspace'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const WORKSPACE_V1_ENDPOINTS = {
  workspaces: {
    create: () => apiPath('/workspaces'),
    get: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}`),
    search: (params?: SearchWorkspacesParams) =>
      withQuery(apiPath('/workspaces'), params as Record<string, string | number | boolean | undefined>),
    update: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}`),
    activate: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/activate`),
    archive: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/archive`),
  },
  members: {
    list: (workspaceId: string, params?: { userId?: string; status?: string; page?: number; size?: number }) =>
      withQuery(apiPath(`/workspaces/${workspaceId}/members`), params as Record<string, string | number | boolean | undefined>),
    add: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/members`),
    activate: (workspaceId: string, memberId: string) =>
      apiPath(`/workspaces/${workspaceId}/members/${memberId}/activate`),
    deactivate: (workspaceId: string, memberId: string) =>
      apiPath(`/workspaces/${workspaceId}/members/${memberId}/deactivate`),
  },
  teams: {
    create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/teams`),
    get: (workspaceId: string, teamId: string) =>
      apiPath(`/workspaces/${workspaceId}/teams/${teamId}`),
    search: (workspaceId: string, params?: { status?: string; page?: number; size?: number }) =>
      withQuery(apiPath(`/workspaces/${workspaceId}/teams`), params as Record<string, string | number | boolean | undefined>),
    update: (workspaceId: string, teamId: string) =>
      apiPath(`/workspaces/${workspaceId}/teams/${teamId}`),
    activate: (workspaceId: string, teamId: string) =>
      apiPath(`/workspaces/${workspaceId}/teams/${teamId}/activate`),
    archive: (workspaceId: string, teamId: string) =>
      apiPath(`/workspaces/${workspaceId}/teams/${teamId}/archive`),
    addMember: (workspaceId: string, teamId: string) =>
      apiPath(`/workspaces/${workspaceId}/teams/${teamId}/members`),
    listMembers: (workspaceId: string, teamId: string, params?: { page?: number; size?: number }) =>
      withQuery(apiPath(`/workspaces/${workspaceId}/teams/${teamId}/members`), params as Record<string, string | number | boolean | undefined>),
    removeMember: (workspaceId: string, teamId: string, userId: string) =>
      apiPath(`/workspaces/${workspaceId}/teams/${teamId}/members/${userId}`),
  },
  invitations: {
    create: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/invitations`),
    list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/invitations`),
    revoke: (workspaceId: string, invitationId: string) =>
      apiPath(`/workspaces/${workspaceId}/invitations/${invitationId}/revoke`),
    accept: (code: string) => apiPath(`/workspaces/invitations/${code}/accept`),
  },
} as const
