import { apiPath } from '@/shared/lib/api-paths'

/**
 * Landscape
 * Description: Org architecture landscape: manage nodes (systems, components)
 *              and the directional links between them.
 */
export const LANDSCAPE_ENDPOINTS = {
  /* --- Nodes --- */
  nodes: (orgId: string, params?: { type?: string; status?: string }) => {
    const p = new URLSearchParams()
    if (params?.type) p.set('type', params.type)
    if (params?.status) p.set('status', params.status)
    const q = p.toString()
    return apiPath(`/workspaces/${orgId}/applications`) + (q ? `?${q}` : '')
  },
  node: (orgId: string, nodeId: string) => apiPath(`/workspaces/${orgId}/applications/${nodeId}`),
  nodePositions: (orgId: string) => apiPath(`/workspaces/${orgId}/applications/positions`),

  /* --- Links --- */
  nodeLinks: (orgId: string) => apiPath(`/workspaces/${orgId}/applications`),
  nodeLink: (orgId: string, linkId: string) => apiPath(`/workspaces/${orgId}/applications/${linkId}`),
} as const
