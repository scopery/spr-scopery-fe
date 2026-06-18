/**
 * Landscape service — Org nodes & node-links (Traceability).
 * API: GET/POST/PATCH/DELETE nodes; GET/POST/DELETE node-links.
 */

import { LANDSCAPE_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'

export type OrgNodeType = 'system' | 'subsystem' | 'module'
export type OrgNodeStatus = 'active' | 'archived'

export interface OrgNode {
  id: string
  org_id: string
  parent_id: string | null
  node_type: OrgNodeType
  code: string
  name: string
  description: string | null
  status: OrgNodeStatus
  position_x?: number | null
  position_y?: number | null
  created_at: string
}

export interface OrgNodesListResponse {
  items: OrgNode[]
  page?: { limit: number; offset: number; total: number }
}

export async function listOrgNodes(
  orgId: string,
  params?: { type?: OrgNodeType; status?: OrgNodeStatus }
): Promise<OrgNodesListResponse> {
  const url = LANDSCAPE_ENDPOINTS.nodes(orgId, params)
  const res = await apiClient.get<OrgNodesListResponse | OrgNode[]>(url)
  if (Array.isArray(res)) {
    return { items: res }
  }
  return res
}

export interface CreateOrgNodePayload {
  parent_id?: string | null
  node_type: OrgNodeType
  code: string
  name: string
  description?: string | null
  position_x?: number | null
  position_y?: number | null
}

export async function createOrgNode(
  orgId: string,
  body: CreateOrgNodePayload
): Promise<OrgNode> {
  const url = LANDSCAPE_ENDPOINTS.nodes(orgId)
  return apiClient.post<OrgNode>(url, body)
}

export interface PatchOrgNodePayload {
  name?: string
  description?: string | null
  status?: OrgNodeStatus
  position_x?: number | null
  position_y?: number | null
}

export async function patchOrgNode(
  orgId: string,
  nodeId: string,
  body: PatchOrgNodePayload
): Promise<OrgNode> {
  const url = LANDSCAPE_ENDPOINTS.node(orgId, nodeId)
  return apiClient.patch<OrgNode>(url, body)
}

export async function archiveOrgNode(orgId: string, nodeId: string): Promise<void> {
  const url = LANDSCAPE_ENDPOINTS.node(orgId, nodeId)
  await apiClient.delete(url)
}

export interface NodePositionItem {
  node_id: string
  position_x: number
  position_y: number
}

export async function batchUpdateNodePositions(
  orgId: string,
  positions: NodePositionItem[]
): Promise<void> {
  if (positions.length === 0) return
  const url = LANDSCAPE_ENDPOINTS.nodePositions(orgId)
  await apiClient.put(url, { positions })
}

/** Node link types per API */
export type NodeLinkType = 'integrates_with' | 'shares_data_with' | 'depends_on' | 'relates_to'

export interface OrgNodeLink {
  id: string
  org_id: string
  from_node_id: string
  to_node_id: string
  link_type: NodeLinkType
  note?: string | null
  created_at?: string
}

export interface OrgNodeLinksListResponse {
  items: OrgNodeLink[]
  page?: { limit: number; offset: number; total: number }
}

export async function listNodeLinks(orgId: string): Promise<OrgNodeLinksListResponse> {
  const url = LANDSCAPE_ENDPOINTS.nodeLinks(orgId)
  const res = await apiClient.get<OrgNodeLinksListResponse | OrgNodeLink[]>(url)
  if (Array.isArray(res)) {
    return { items: res }
  }
  return res
}

export interface CreateNodeLinkPayload {
  from_node_id: string
  to_node_id: string
  link_type: NodeLinkType
}

export async function createNodeLink(
  orgId: string,
  body: CreateNodeLinkPayload
): Promise<OrgNodeLink> {
  const url = LANDSCAPE_ENDPOINTS.nodeLinks(orgId)
  return apiClient.post<OrgNodeLink>(url, body)
}

export interface PatchNodeLinkPayload {
  link_type?: NodeLinkType
  note?: string | null
}

export async function patchNodeLink(
  orgId: string,
  linkId: string,
  body: PatchNodeLinkPayload
): Promise<OrgNodeLink> {
  const url = LANDSCAPE_ENDPOINTS.nodeLink(orgId, linkId)
  return apiClient.patch<OrgNodeLink>(url, body)
}

export async function deleteNodeLink(orgId: string, linkId: string): Promise<void> {
  const url = LANDSCAPE_ENDPOINTS.nodeLink(orgId, linkId)
  await apiClient.delete(url)
}
