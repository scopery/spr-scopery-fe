import { apiPath } from '@/shared/lib/api-paths'

/** Workspace context (v1): current workspace, available list, switch. */
export const WORKSPACE_CONTEXT_ENDPOINTS = {
  current: () => apiPath('/workspace-context/current'),
  available: () => apiPath('/workspace-context/available'),
  switch: () => apiPath('/workspace-context/current'),
} as const
