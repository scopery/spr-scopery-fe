/**
 * Project-scoped Functional Catalog — match BE Traceability Functional Catalog DTOs.
 */

export const FunctionalItemPriority = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const
export type FunctionalItemPriority =
  (typeof FunctionalItemPriority)[keyof typeof FunctionalItemPriority]

export const FunctionalItemType = {
  Functional: 'FUNCTIONAL',
  UserStory: 'USER_STORY',
  UseCase: 'USE_CASE',
} as const
export type FunctionalItemType = (typeof FunctionalItemType)[keyof typeof FunctionalItemType]

export const FunctionalItemStatus = {
  Draft: 'DRAFT',
  InReview: 'IN_REVIEW',
  Approved: 'APPROVED',
  Implemented: 'IMPLEMENTED',
  Archived: 'ARCHIVED',
} as const
export type FunctionalItemStatus =
  (typeof FunctionalItemStatus)[keyof typeof FunctionalItemStatus]

export const FunctionalItemAnchorNodeType = {
  Screen: 'SCREEN',
  ApiEndpoint: 'API_ENDPOINT',
  DataEntity: 'DATA_ENTITY',
  AppComponent: 'APP_COMPONENT',
  AppModule: 'APP_MODULE',
} as const
export type FunctionalItemAnchorNodeType =
  (typeof FunctionalItemAnchorNodeType)[keyof typeof FunctionalItemAnchorNodeType]

export const NonFunctionalCategory = {
  Performance: 'PERFORMANCE',
  Security: 'SECURITY',
  Usability: 'USABILITY',
  Reliability: 'RELIABILITY',
  Maintainability: 'MAINTAINABILITY',
  Scalability: 'SCALABILITY',
  Compatibility: 'COMPATIBILITY',
  Other: 'OTHER',
} as const
export type NonFunctionalCategory =
  (typeof NonFunctionalCategory)[keyof typeof NonFunctionalCategory]

export const NonFunctionalScopeType = {
  System: 'SYSTEM',
  Module: 'MODULE',
  Feature: 'FEATURE',
} as const
export type NonFunctionalScopeType =
  (typeof NonFunctionalScopeType)[keyof typeof NonFunctionalScopeType]

export const NonFunctionalItemStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Deprecated: 'DEPRECATED',
  Archived: 'ARCHIVED',
} as const
export type NonFunctionalItemStatus =
  (typeof NonFunctionalItemStatus)[keyof typeof NonFunctionalItemStatus]

export const BusinessRuleSeverity = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const
export type BusinessRuleSeverity =
  (typeof BusinessRuleSeverity)[keyof typeof BusinessRuleSeverity]

export const BusinessRuleStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Deprecated: 'DEPRECATED',
  Archived: 'ARCHIVED',
} as const
export type BusinessRuleStatus = (typeof BusinessRuleStatus)[keyof typeof BusinessRuleStatus]

export interface FunctionalItem {
  id: string
  projectId: string
  workspaceId: string
  code: string
  title: string
  description?: string | null
  priority: string
  status: string
  type: string
  moduleId?: string | null
  acceptanceCriteria?: string[] | null
  createdAt: string
  updatedAt: string
}

export interface NonFunctionalItem {
  id: string
  projectId: string
  workspaceId: string
  code: string
  title: string
  description?: string | null
  category: string
  priority: string
  status: string
  targetMetric?: string | null
  scopeType: string
  scopeRefId?: string | null
  createdAt: string
  updatedAt: string
}

export interface BusinessRule {
  id: string
  functionalItemId: string
  projectId: string
  code: string
  title: string
  description?: string | null
  severity: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface FunctionalItemAnchor {
  id: string
  functionalItemId: string
  nodeType: string
  nodeId: string
  note?: string | null
  createdAt: string
}

export interface CreateFunctionalItemBody {
  code: string
  title: string
  description?: string | null
  priority: string
  type: string
  acceptanceCriteria?: string[] | null
  /** Optional nested rules created with the FR (same item / transaction). */
  businessRules?: CreateBusinessRuleBody[] | null
  workspaceId: string
  moduleId?: string | null
}

export interface UpdateFunctionalItemBody {
  title: string
  description?: string | null
  priority?: string | null
  status?: string | null
  type?: string | null
  acceptanceCriteria?: string[] | null
  moduleId?: string | null
}

export interface CreateNonFunctionalItemBody {
  code: string
  title: string
  description?: string | null
  category: string
  priority: string
  targetMetric?: string | null
  scopeType: string
  scopeRefId?: string | null
}

export interface UpdateNonFunctionalItemBody {
  title: string
  description?: string | null
  category?: string | null
  priority?: string | null
  status?: string | null
  targetMetric?: string | null
  scopeType?: string | null
  scopeRefId?: string | null
}

export interface CreateBusinessRuleBody {
  code: string
  title: string
  description?: string | null
  severity: string
}

export interface UpdateBusinessRuleBody {
  title: string
  description?: string | null
  severity?: string | null
  status?: string | null
}

export interface AddFunctionalItemAnchorBody {
  nodeType: string
  nodeId: string
  note?: string | null
}
