import { apiClient } from '@/shared/lib/apiClient'
import { PHASE_DEFINITION_ENDPOINTS } from './endpoints'
import type {
  CreatePhaseDefinitionPayload,
  PhaseDefinition,
  PhaseDefinitionPage,
  SearchPhaseDefinitionsParams,
  UpdatePhaseDefinitionPayload,
} from '../../domain/model/phase-definition'

export async function searchPhaseDefinitions(
  params?: SearchPhaseDefinitionsParams
): Promise<PhaseDefinitionPage> {
  return apiClient.get<PhaseDefinitionPage>(
    PHASE_DEFINITION_ENDPOINTS.search({ page: 0, size: 100, ...params })
  )
}

/** @deprecated use searchPhaseDefinitions */
export async function listPhaseDefinitions(
  params?: SearchPhaseDefinitionsParams
): Promise<PhaseDefinitionPage> {
  return searchPhaseDefinitions(params)
}

export async function getPhaseDefinition(id: string): Promise<PhaseDefinition> {
  return apiClient.get<PhaseDefinition>(PHASE_DEFINITION_ENDPOINTS.get(id))
}

export async function createSystemPhaseDefinition(
  body: CreatePhaseDefinitionPayload
): Promise<PhaseDefinition> {
  return apiClient.post<PhaseDefinition>(PHASE_DEFINITION_ENDPOINTS.createSystem(), body)
}

export async function createOrgPhaseDefinition(
  body: CreatePhaseDefinitionPayload
): Promise<PhaseDefinition> {
  return apiClient.post<PhaseDefinition>(PHASE_DEFINITION_ENDPOINTS.createOrg(), body)
}

export async function createWorkspacePhaseDefinition(
  workspaceId: string,
  body: CreatePhaseDefinitionPayload
): Promise<PhaseDefinition> {
  return apiClient.post<PhaseDefinition>(
    PHASE_DEFINITION_ENDPOINTS.createWorkspace(workspaceId),
    body
  )
}

export async function updatePhaseDefinition(
  id: string,
  body: UpdatePhaseDefinitionPayload
): Promise<PhaseDefinition> {
  return apiClient.patch<PhaseDefinition>(PHASE_DEFINITION_ENDPOINTS.update(id), body)
}

export async function activatePhaseDefinition(id: string): Promise<PhaseDefinition> {
  return apiClient.post<PhaseDefinition>(PHASE_DEFINITION_ENDPOINTS.activate(id), {})
}

export async function deactivatePhaseDefinition(id: string): Promise<PhaseDefinition> {
  return apiClient.post<PhaseDefinition>(PHASE_DEFINITION_ENDPOINTS.deactivate(id), {})
}

export async function archivePhaseDefinition(id: string): Promise<PhaseDefinition> {
  return apiClient.post<PhaseDefinition>(PHASE_DEFINITION_ENDPOINTS.archive(id), {})
}
