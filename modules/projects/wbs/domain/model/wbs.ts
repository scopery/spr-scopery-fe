/**
 * WBS Node domain model — matches BE `WbsNodeResponse`
 * (`/api/projects/{projectId}/wbs-nodes`).
 */
export interface WbsNode {
  id: string
  projectId: string
  projectPhaseId: string | null
  parentId: string | null
  code: string
  title: string
  description: string | null
  nodeType: string
  level: number
  path: string
  sortOrder: number
  plannedStartDate?: string | null
  plannedEndDate?: string | null
  status: string
  version: number
  createdAt: string
  updatedAt: string
  /** Present only when returned by the `/wbs-nodes/tree` endpoint. */
  children?: WbsNode[]
}

/** WBS node with its subtree always resolved (built client-side via `buildWbsTree`). */
export interface WbsTreeNode extends WbsNode {
  children: WbsTreeNode[]
}

export interface CreateWbsNodePayload {
  code: string
  title: string
  description?: string | null
  phaseId: string
  parentId?: string | null
  nodeType: string
  sortOrder?: number
}

export interface UpdateWbsNodePayload {
  title?: string
  description?: string | null
  nodeType?: string
  sortOrder?: number
  plannedStartDate?: string | null
  plannedEndDate?: string | null
}

export interface MoveWbsNodePayload {
  newParentId: string | null
  newSortOrder: number
}
