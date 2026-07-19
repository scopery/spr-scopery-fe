import { apiPath } from '@/shared/lib/api-paths'

/**
 * Permissions
 * Description: Resolve the current user's effective permissions for an org,
 *              optionally scoped to a specific project.
 */
export const ACCESS_ENDPOINTS = {
  effectivePermissions: (orgId: string, projectId?: string) => {
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    const q = params.toString()
    return apiPath(`/workspaces/${orgId}/access`) + (q ? `?${q}` : '')
  },
} as const
