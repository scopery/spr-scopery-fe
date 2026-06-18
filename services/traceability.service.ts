/**
 * Traceability Service
 * Covers: Org Landscape (nodes, links), Project Scope, Org Actors, Requirements, Trace Links,
 * and document-level trace (item ↔ section mapping).
 */

import { apiClient } from '@/shared/lib/apiClient'
import type {
  OrgNode,
  OrgNodesListRequest,
  OrgNodesListResponse,
  OrgNodeCreateRequest,
  OrgNodeUpdateRequest,
  NodeLink,
  NodeLinksListResponse,
  NodeLinkCreateRequest,
  NodeLinkUpdateRequest,
  NodesPositionsBatchRequest,
  ProjectScope,
  ProjectScopeListResponse,
  ProjectScopeReplaceRequest,
  OrgActor,
  OrgActorsListRequest,
  OrgActorsListResponse,
  OrgActorCreateRequest,
  OrgActorUpdateRequest,
  Requirement,
  RequirementsListResponse,
  RequirementCreateRequest,
  RequirementUpdateRequest,
  RequirementActorsReplaceRequest,
  RequirementModulesReplaceRequest,
  TraceLink,
  TraceLinksListResponse,
  TraceLinkCreateRequest,
  TraceLinkUpdateRequest,
  TraceViewResponse,
  TraceSummary,
  ItemTrace,
} from '@/types/traceability'

// ============================================================================
// 1. Org Landscape - Nodes
// ============================================================================

export async function listOrgNodes(
  orgId: string,
  params?: OrgNodesListRequest
): Promise<OrgNodesListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.type) searchParams.append('type', params.type)
  if (params?.status) searchParams.append('status', params.status)
  const queryString = searchParams.toString()
  const url = `/api/v2/orgs/${orgId}/nodes${queryString ? `?${queryString}` : ''}`
  return apiClient.get<OrgNodesListResponse>(url)
}

export async function createOrgNode(orgId: string, payload: OrgNodeCreateRequest): Promise<OrgNode> {
  return apiClient.post<OrgNode>(`/api/v2/orgs/${orgId}/nodes`, payload)
}

export async function updateOrgNode(orgId: string, nodeId: string, payload: OrgNodeUpdateRequest): Promise<OrgNode> {
  return apiClient.patch<OrgNode>(`/api/v2/orgs/${orgId}/nodes/${nodeId}`, payload)
}

export async function deleteOrgNode(orgId: string, nodeId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v2/orgs/${orgId}/nodes/${nodeId}`)
}

// ============================================================================
// 2. Org Landscape - Node Links
// ============================================================================

export async function listNodeLinks(orgId: string): Promise<NodeLinksListResponse> {
  return apiClient.get<NodeLinksListResponse>(`/api/v2/orgs/${orgId}/node-links`)
}

export async function createNodeLink(orgId: string, payload: NodeLinkCreateRequest): Promise<NodeLink> {
  return apiClient.post<NodeLink>(`/api/v2/orgs/${orgId}/node-links`, payload)
}

export async function updateNodeLink(orgId: string, linkId: string, payload: NodeLinkUpdateRequest): Promise<NodeLink> {
  return apiClient.patch<NodeLink>(`/api/v2/orgs/${orgId}/node-links/${linkId}`, payload)
}

export async function deleteNodeLink(orgId: string, linkId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v2/orgs/${orgId}/node-links/${linkId}`)
}

// ============================================================================
// 3. Org Landscape - Positions
// ============================================================================

export async function updateNodesPositions(orgId: string, payload: NodesPositionsBatchRequest): Promise<void> {
  return apiClient.put<void>(`/api/v2/orgs/${orgId}/nodes/positions`, payload)
}

// ============================================================================
// 4. Project Scope
// ============================================================================

export async function getProjectScope(orgId: string, projectId: string): Promise<ProjectScopeListResponse> {
  return apiClient.get<ProjectScopeListResponse>(`/api/v2/orgs/${orgId}/projects/${projectId}/scope`)
}

export async function replaceProjectScope(
  orgId: string,
  projectId: string,
  payload: ProjectScopeReplaceRequest
): Promise<ProjectScopeListResponse> {
  return apiClient.put<ProjectScopeListResponse>(`/api/v2/orgs/${orgId}/projects/${projectId}/scope`, payload)
}

// ============================================================================
// 5. Org Actors
// ============================================================================

export async function listOrgActors(orgId: string, params?: OrgActorsListRequest): Promise<OrgActorsListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.append('limit', String(params.limit))
  if (params?.offset) searchParams.append('offset', String(params.offset))
  if (params?.active_only) searchParams.append('active_only', String(params.active_only))
  const queryString = searchParams.toString()
  const url = `/api/v2/orgs/${orgId}/actors${queryString ? `?${queryString}` : ''}`
  return apiClient.get<OrgActorsListResponse>(url)
}

export async function createOrgActor(orgId: string, payload: OrgActorCreateRequest): Promise<OrgActor> {
  return apiClient.post<OrgActor>(`/api/v2/orgs/${orgId}/actors`, payload)
}

export async function updateOrgActor(orgId: string, actorId: string, payload: OrgActorUpdateRequest): Promise<OrgActor> {
  return apiClient.patch<OrgActor>(`/api/v2/orgs/${orgId}/actors/${actorId}`, payload)
}

// ============================================================================
// 6. Requirements
// ============================================================================

export async function listRequirements(orgId: string, projectId: string): Promise<RequirementsListResponse> {
  return apiClient.get<RequirementsListResponse>(`/api/v2/orgs/${orgId}/projects/${projectId}/requirements`)
}

export async function createRequirement(
  orgId: string,
  projectId: string,
  payload: RequirementCreateRequest
): Promise<Requirement> {
  return apiClient.post<Requirement>(`/api/v2/orgs/${orgId}/projects/${projectId}/requirements`, payload)
}

export async function updateRequirement(
  orgId: string,
  projectId: string,
  requirementId: string,
  payload: RequirementUpdateRequest
): Promise<Requirement> {
  return apiClient.patch<Requirement>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}`,
    payload
  )
}

// ============================================================================
// 7. Requirement Actors & Modules
// ============================================================================

export async function replaceRequirementActors(
  orgId: string,
  projectId: string,
  requirementId: string,
  payload: RequirementActorsReplaceRequest
): Promise<void> {
  return apiClient.put<void>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}/actors`,
    payload
  )
}

export async function replaceRequirementModules(
  orgId: string,
  projectId: string,
  requirementId: string,
  payload: RequirementModulesReplaceRequest
): Promise<void> {
  return apiClient.put<void>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}/modules`,
    payload
  )
}

// ============================================================================
// 8. Trace Links
// ============================================================================

export async function listTraceLinks(orgId: string, projectId: string): Promise<TraceLinksListResponse> {
  return apiClient.get<TraceLinksListResponse>(`/api/v2/orgs/${orgId}/projects/${projectId}/trace-links`)
}

export async function createTraceLink(
  orgId: string,
  projectId: string,
  payload: TraceLinkCreateRequest
): Promise<TraceLink> {
  return apiClient.post<TraceLink>(`/api/v2/orgs/${orgId}/projects/${projectId}/trace-links`, payload)
}

export async function updateTraceLink(
  orgId: string,
  projectId: string,
  linkId: string,
  payload: TraceLinkUpdateRequest
): Promise<TraceLink> {
  return apiClient.patch<TraceLink>(
    `/api/v2/orgs/${orgId}/projects/${projectId}/trace-links/${linkId}`,
    payload
  )
}

export async function deleteTraceLink(orgId: string, projectId: string, linkId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v2/orgs/${orgId}/projects/${projectId}/trace-links/${linkId}`)
}

// ============================================================================
// 9. Trace View (Full Context)
// ============================================================================

export async function getTraceView(orgId: string, projectId: string): Promise<TraceViewResponse> {
  return apiClient.get<TraceViewResponse>(`/api/v2/orgs/${orgId}/projects/${projectId}/trace`)
}

// ============================================================================
// 10. Document-level Trace (item ↔ section mapping — stub pending items/outline services)
// ============================================================================

export interface ProjectTraceDerivedResult {
  summary: TraceSummary
  byItem: Map<string, ItemTrace>
  bySection: Map<string, string[]>
}

export async function getProjectTraceDerived(
  _ctx: { orgId: string },
  _projectId: string,
  _documentId: string,
  _versionId: string
): Promise<ProjectTraceDerivedResult> {
  return {
    summary: { total_items: 0, mapped_items: 0, unmapped_items: 0, coverage_pct: 0 },
    byItem: new Map(),
    bySection: new Map(),
  }
}

export async function mapItemToSection(
  _ctx: { orgId: string },
  _documentId: string,
  _versionId: string,
  _sectionId: string,
  _itemId: string
): Promise<unknown> {
  throw new Error('Trace mapping requires items/outline services')
}

export async function unmapItemFromSection(
  _ctx: { orgId: string },
  _documentId: string,
  _versionId: string,
  _sectionId: string,
  _itemId: string
): Promise<void> {
  throw new Error('Trace unmapping requires items/outline services')
}
