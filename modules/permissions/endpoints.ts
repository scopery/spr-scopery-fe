import { apiPath } from '@/shared/lib/api-paths'

/**
 * Permissions
 * Description: Resolve the current user's effective permissions.
 */
export const ACCESS_ENDPOINTS = {
  effectivePermissions: (_orgId?: string, _projectId?: string) => {
    return apiPath('/iam/me/effective-permissions')
  },
} as const
