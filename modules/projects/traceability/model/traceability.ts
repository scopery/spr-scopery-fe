/**
 * Traceability Type Definitions
 * Covers: Org Landscape (nodes, links), Project Scope, Org Actors, Requirements, Trace Links
 */

import type {
  OrgNodeType,
  OrgNodeStatus,
  NodeLinkType,
  ScopeRole,
  ActorKind,
  RequirementType,
  TraceLinkType,
  TraceEntityType,
} from '@/shared/lib/api-enums'

// ============================================================================
// 1. Org Landscape - Nodes
// ============================================================================

export interface OrgNode {
  id: string
  org_id: string
  parent_id: string | null
  node_type: OrgNodeType
  code: string
  name: string
  description: string | null
  status: OrgNodeStatus
  position_x: number | null
  position_y: number | null
  created_at: string
  updated_at: string
}

export interface OrgNodesListRequest {
  type?: OrgNodeType
  status?: OrgNodeStatus
}

export interface OrgNodesListResponse {
  items: OrgNode[]
}

export interface OrgNodeCreateRequest {
  parent_id?: string | null
  node_type: OrgNodeType
  code: string
  name: string
  description?: string | null
}

export interface OrgNodeUpdateRequest {
  name?: string
  description?: string | null
  status?: OrgNodeStatus
}

// ============================================================================
// 2. Org Landscape - Node Links
// ============================================================================

export interface NodeLink {
  id: string
  org_id: string
  from_node_id: string
  to_node_id: string
  link_type: NodeLinkType
  note: string | null
  created_at: string
}

export interface NodeLinksListResponse {
  items: NodeLink[]
}

export interface NodeLinkCreateRequest {
  from_node_id: string
  to_node_id: string
  link_type: NodeLinkType
  note?: string | null
}

export interface NodeLinkUpdateRequest {
  link_type?: NodeLinkType
  note?: string | null
}

// ============================================================================
// 3. Org Landscape - Positions (Phase 2.1 Optional)
// ============================================================================

export interface NodePositionUpdate {
  node_id: string
  position_x: number
  position_y: number
}

export interface NodesPositionsBatchRequest {
  positions: NodePositionUpdate[]
}

// ============================================================================
// 4. Project Scope
// ============================================================================

export interface ProjectScopeItem {
  org_node_id: string
  scope_role: ScopeRole
}

export interface ProjectScope {
  project_id: string
  org_node_id: string
  scope_role: ScopeRole
}

export interface ProjectScopeListResponse {
  items: ProjectScope[]
}

export interface ProjectScopeReplaceRequest {
  items: ProjectScopeItem[]
}

// ============================================================================
// 5. Org Actors
// ============================================================================

export interface OrgActor {
  id: string
  org_id: string
  actor_key: string
  name: string
  kind: ActorKind
  description: string | null
  created_at: string
  updated_at: string
}

export interface OrgActorsListRequest {
  limit?: number
  offset?: number
  active_only?: boolean
}

export interface OrgActorsListResponse {
  items: OrgActor[]
  page: {
    limit: number
    offset: number
    total: number
  }
}

export interface OrgActorCreateRequest {
  actor_key: string
  name: string
  kind: ActorKind
  description?: string | null
}

export interface OrgActorUpdateRequest {
  name?: string
  kind?: ActorKind
  description?: string | null
}

// ============================================================================
// 6. Requirements
// ============================================================================

export interface Requirement {
  id: string
  project_id: string
  parent_id: string | null
  req_type: RequirementType
  code: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface RequirementsListResponse {
  items: Requirement[]
}

export interface RequirementCreateRequest {
  parent_id?: string | null
  req_type: RequirementType
  code: string
  title: string
  description?: string | null
}

export interface RequirementUpdateRequest {
  title?: string
  description?: string | null
  parent_id?: string | null
}

// ============================================================================
// 7. Requirement Actors & Modules
// ============================================================================

export interface RequirementActor {
  requirement_id: string
  actor_id: string
}

export interface RequirementModule {
  requirement_id: string
  org_node_id: string
}

export interface RequirementActorsReplaceRequest {
  actor_ids: string[]
}

export interface RequirementModulesReplaceRequest {
  org_node_ids: string[]
}

// ============================================================================
// 8. Trace Links
// ============================================================================

export interface TraceLink {
  id: string
  org_id: string
  project_id: string | null
  from_type: TraceEntityType
  from_id: string
  to_type: TraceEntityType
  to_id: string
  link_type: TraceLinkType
  note: string | null
  created_at: string
}

export interface TraceLinksListResponse {
  items: TraceLink[]
}

export interface TraceLinkCreateRequest {
  from_type: TraceEntityType
  from_id: string
  to_type: TraceEntityType
  to_id: string
  link_type: TraceLinkType
  note?: string | null
  project_id?: string | null
}

export interface TraceLinkUpdateRequest {
  link_type?: TraceLinkType
  note?: string | null
}

// ============================================================================
// 9. Document-level Trace (item ↔ section mapping)
// ============================================================================

export interface TraceSectionRef {
  section_id: string
  section_title: string
  section_path: string
  document_id?: string
  version_id: string
}

export interface ItemTrace {
  item_id: string
  refs: TraceSectionRef[]
}

export interface TraceSummary {
  total_items: number
  mapped_items: number
  unmapped_items: number
  coverage_pct: number
}

export interface TraceFilters {
  item_type?: string
  status?: string
  priority?: string
  /** Client-side search (title / business_id); do not send to BE if not supported */
  q?: string
}

export interface OutlineSectionWithItems {
  id: string
  document_version_id: string
  title: string
  section_key?: string | null
  parent_id?: string | null
  sort_order?: number | null
  items?: { item_id: string }[]
}

// ============================================================================
// 10. Trace View (Full Context)
// ============================================================================

export interface TraceViewResponse {
  landscape: {
    nodes: OrgNode[]
    links: NodeLink[]
  }
  project_scope: ProjectScope[]
  catalog: {
    requirements: Requirement[]
    actors: OrgActor[]
    requirement_actors: RequirementActor[]
    requirement_modules: RequirementModule[]
  }
  trace_links: TraceLink[]
}
