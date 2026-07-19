import { apiClient } from '@/shared/lib/apiClient'
import { ESTIMATION_ENDPOINTS } from './endpoints'
import type {
  CreateEstimationRunPayload,
  EstimationRun,
  PhaseEstimateRollup,
  PreviewRateImpactPayload,
  ProjectEstimateSummary,
  TaskEstimateSnapshot,
  TaskRatePreview,
  WbsEstimateRollup,
} from '../../domain/model/estimation'

function asList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function listEstimationRuns(projectId: string): Promise<EstimationRun[]> {
  const data = await apiClient.get<EstimationRun[] | { items: EstimationRun[] }>(
    ESTIMATION_ENDPOINTS.runs.list(projectId)
  )
  return asList(data)
}

export async function createEstimationRun(
  projectId: string,
  body: CreateEstimationRunPayload
): Promise<EstimationRun> {
  return apiClient.post<EstimationRun>(ESTIMATION_ENDPOINTS.runs.create(projectId), body)
}

export async function getEstimationRun(
  projectId: string,
  runId: string
): Promise<EstimationRun> {
  return apiClient.get<EstimationRun>(ESTIMATION_ENDPOINTS.runs.get(projectId, runId))
}

export async function cancelEstimationRun(
  projectId: string,
  runId: string
): Promise<EstimationRun> {
  return apiClient.post<EstimationRun>(ESTIMATION_ENDPOINTS.runs.cancel(projectId, runId), {})
}

export async function markEstimationCurrent(
  projectId: string,
  runId: string
): Promise<EstimationRun> {
  return apiClient.post<EstimationRun>(
    ESTIMATION_ENDPOINTS.runs.markCurrent(projectId, runId),
    {}
  )
}

export async function getEstimationRunSummary(
  projectId: string,
  runId: string
): Promise<ProjectEstimateSummary> {
  return apiClient.get<ProjectEstimateSummary>(
    ESTIMATION_ENDPOINTS.runs.summary(projectId, runId)
  )
}

export async function listEstimationRunTasks(
  projectId: string,
  runId: string
): Promise<TaskEstimateSnapshot[]> {
  const data = await apiClient.get<
    TaskEstimateSnapshot[] | { items: TaskEstimateSnapshot[] }
  >(ESTIMATION_ENDPOINTS.runs.tasks(projectId, runId))
  return asList(data)
}

export async function listEstimationWbsRollups(
  projectId: string,
  runId: string
): Promise<WbsEstimateRollup[]> {
  const data = await apiClient.get<WbsEstimateRollup[] | { items: WbsEstimateRollup[] }>(
    ESTIMATION_ENDPOINTS.runs.wbsRollups(projectId, runId)
  )
  return asList(data)
}

export async function listEstimationPhaseRollups(
  projectId: string,
  runId: string
): Promise<PhaseEstimateRollup[]> {
  const data = await apiClient.get<PhaseEstimateRollup[] | { items: PhaseEstimateRollup[] }>(
    ESTIMATION_ENDPOINTS.runs.phaseRollups(projectId, runId)
  )
  return asList(data)
}

export async function getCurrentEstimation(projectId: string): Promise<EstimationRun | null> {
  try {
    return await apiClient.get<EstimationRun>(ESTIMATION_ENDPOINTS.current.get(projectId))
  } catch {
    return null
  }
}

export async function getCurrentEstimationSummary(
  projectId: string
): Promise<ProjectEstimateSummary | null> {
  try {
    return await apiClient.get<ProjectEstimateSummary>(
      ESTIMATION_ENDPOINTS.current.summary(projectId)
    )
  } catch {
    return null
  }
}

export async function previewRateImpact(
  projectId: string,
  body: PreviewRateImpactPayload
): Promise<TaskRatePreview> {
  return apiClient.post<TaskRatePreview>(
    ESTIMATION_ENDPOINTS.previewRateImpact(projectId),
    body
  )
}
