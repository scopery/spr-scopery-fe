import { PROJECT_ENDPOINTS } from '../../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { assertBulkItemCount, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import type {
  CreateProjectPhasePayload,
  ProjectPhase,
  ProjectPhasePageResponse,
  UpdateProjectPhasePayload,
} from '../../domain/model/phase'

export async function listPhases(
  projectId: string,
  params?: { status?: string; page?: number; size?: number }
): Promise<ProjectPhasePageResponse> {
  return apiClient.get<ProjectPhasePageResponse>(PROJECT_ENDPOINTS.phases.list(projectId, params))
}

export async function getPhase(projectId: string, phaseId: string): Promise<ProjectPhase> {
  return apiClient.get<ProjectPhase>(PROJECT_ENDPOINTS.phases.get(projectId, phaseId))
}

export async function createPhase(
  projectId: string,
  body: CreateProjectPhasePayload
): Promise<ProjectPhase> {
  return apiClient.post<ProjectPhase>(PROJECT_ENDPOINTS.phases.create(projectId), body)
}

export async function submitPhasesBulk(
  projectId: string,
  items: CreateProjectPhasePayload[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(PROJECT_ENDPOINTS.phases.bulk(projectId), { items }, { skipGlobalLoading: true })
}

export async function updatePhase(
  projectId: string,
  phaseId: string,
  body: UpdateProjectPhasePayload
): Promise<ProjectPhase> {
  return apiClient.put<ProjectPhase>(PROJECT_ENDPOINTS.phases.update(projectId, phaseId), body)
}

export async function activatePhase(projectId: string, phaseId: string): Promise<ProjectPhase> {
  return apiClient.patch<ProjectPhase>(PROJECT_ENDPOINTS.phases.activate(projectId, phaseId))
}

export async function completePhase(projectId: string, phaseId: string): Promise<ProjectPhase> {
  return apiClient.patch<ProjectPhase>(PROJECT_ENDPOINTS.phases.complete(projectId, phaseId))
}

export async function archivePhase(projectId: string, phaseId: string): Promise<ProjectPhase> {
  return apiClient.patch<ProjectPhase>(PROJECT_ENDPOINTS.phases.archive(projectId, phaseId))
}

export async function createPhaseFromDefinition(
  projectId: string,
  body: { phaseDefinitionId: string }
): Promise<ProjectPhase> {
  return apiClient.post<ProjectPhase>(
    PROJECT_ENDPOINTS.phases.createFromDefinition(projectId),
    body
  )
}
