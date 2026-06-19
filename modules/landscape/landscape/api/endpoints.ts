import { v2 } from '@/shared/lib/api-paths'

export const LANDSCAPE_ENDPOINTS = {
  nodes: (orgId: string, params?: { type?: string; status?: string }) => {
    const p = new URLSearchParams()
    if (params?.type) p.set('type', params.type)
    if (params?.status) p.set('status', params.status)
    const q = p.toString()
    return v2(`/orgs/${orgId}/nodes`) + (q ? `?${q}` : '')
  },
  node: (orgId: string, nodeId: string) => v2(`/orgs/${orgId}/nodes/${nodeId}`),
  nodePositions: (orgId: string) => v2(`/orgs/${orgId}/nodes/positions`),
  nodeLinks: (orgId: string) => v2(`/orgs/${orgId}/node-links`),
  nodeLink: (orgId: string, linkId: string) => v2(`/orgs/${orgId}/node-links/${linkId}`),
} as const
