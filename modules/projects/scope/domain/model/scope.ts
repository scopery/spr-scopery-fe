/** Matches BE `ScopePackageResponse` (`/api/projects/{projectId}/scope-packages`). */
export interface ScopePackage {
  id: string
  projectId: string
  code: string
  name: string
  description: string | null
  status: string
  currentFlag: boolean
  approvedAt: string | null
  approvedBy: string | null
  createdAt: string
}

/** Matches BE `ScopeItemResponse` (`/api/projects/{projectId}/scope-items/*`). */
export interface ScopeItem {
  id: string
  scopePackageId: string
  projectId: string
  type: string
  code: string
  title: string
  description: string | null
  inScope: boolean
  outOfScope: boolean
  priority: string
  acceptanceRequired: boolean
  status: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateScopePackagePayload {
  code: string
  name: string
  description?: string | null
}

export interface CreateScopeItemPayload {
  type: string
  code: string
  title: string
  description?: string | null
  inScope?: boolean
  outOfScope?: boolean
  priority?: string
  acceptanceRequired?: boolean
  sortOrder?: number
}

export interface UpdateScopeItemPayload {
  type?: string
  code?: string
  title?: string
  description?: string | null
  inScope?: boolean
  outOfScope?: boolean
  priority?: string
  acceptanceRequired?: boolean
  sortOrder?: number
}

/** Requirement linked to a scope package (BE RequirementResponse). */
export interface ScopePackageRequirement {
  id: string
  projectId: string
  code: string
  title: string
  description?: string | null
  requirementType?: string
  priority?: string
  status?: string
  scopePackageId?: string | null
  scopeItemId?: string | null
  createdAt?: string
  updatedAt?: string
}
