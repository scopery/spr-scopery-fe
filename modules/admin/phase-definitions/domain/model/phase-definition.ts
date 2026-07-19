import type { PhaseDefinitionScope, PhaseDefinitionStatus } from '../enums/phase-definition.enum'

export interface PhaseDefinition {
  id: string
  code: string
  name: string
  description: string | null
  scope: PhaseDefinitionScope | string
  organizationId: string | null
  workspaceId: string | null
  displayOrder: number
  isSystemDefault: boolean
  status: PhaseDefinitionStatus | string
  version: number
  createdAt: string
  updatedAt: string
}

export interface PhaseDefinitionPage {
  items: PhaseDefinition[]
  page: number
  size: number
  totalElements: number
}

export interface CreatePhaseDefinitionPayload {
  code: string
  name: string
  description?: string | null
  scope?: string
  displayOrder?: number
  isDefault?: boolean
}

export interface UpdatePhaseDefinitionPayload {
  name?: string
  description?: string | null
  displayOrder?: number
  isDefault?: boolean
}

export interface SearchPhaseDefinitionsParams {
  scope?: string
  organizationId?: string
  workspaceId?: string
  keyword?: string
  status?: string
  page?: number
  size?: number
}

/** @deprecated use CreatePhaseDefinitionPayload */
export interface CreateWorkspacePhaseDefinitionPayload {
  code: string
  name: string
  description?: string | null
  displayOrder?: number
}
