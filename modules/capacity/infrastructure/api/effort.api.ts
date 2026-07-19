import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type {
  ActualEffortRecord,
  CreateActualEffortPayload,
  CreateEffortEstimatePayload,
  CreateWorkloadSnapshotPayload,
  EffortEstimate,
  WorkloadSnapshot,
} from '../../domain/model/effort'

function asList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function listEffortEstimates(projectId: string): Promise<EffortEstimate[]> {
  const data = await apiClient.get<EffortEstimate[] | { items: EffortEstimate[] }>(
    CAPACITY_ENDPOINTS.projectResources.effortEstimates(projectId)
  )
  return asList(data)
}

export async function createEffortEstimate(
  projectId: string,
  body: CreateEffortEstimatePayload
): Promise<EffortEstimate> {
  return apiClient.post<EffortEstimate>(
    CAPACITY_ENDPOINTS.projectResources.effortEstimates(projectId),
    body
  )
}

export async function listActualEffort(projectId: string): Promise<ActualEffortRecord[]> {
  const data = await apiClient.get<ActualEffortRecord[] | { items: ActualEffortRecord[] }>(
    CAPACITY_ENDPOINTS.projectResources.actualEffort(projectId)
  )
  return asList(data)
}

export async function createActualEffort(
  projectId: string,
  body: CreateActualEffortPayload
): Promise<ActualEffortRecord> {
  return apiClient.post<ActualEffortRecord>(
    CAPACITY_ENDPOINTS.projectResources.actualEffort(projectId),
    body
  )
}

export async function cancelActualEffort(
  projectId: string,
  recordId: string
): Promise<ActualEffortRecord> {
  return apiClient.post<ActualEffortRecord>(
    CAPACITY_ENDPOINTS.projectResources.cancelActualEffort(projectId, recordId),
    {}
  )
}

export async function listWorkloadSnapshots(projectId: string): Promise<WorkloadSnapshot[]> {
  const data = await apiClient.get<WorkloadSnapshot[] | { items: WorkloadSnapshot[] }>(
    CAPACITY_ENDPOINTS.projectResources.workloadSnapshots(projectId)
  )
  return asList(data)
}

export async function createWorkloadSnapshot(
  projectId: string,
  body?: CreateWorkloadSnapshotPayload
): Promise<WorkloadSnapshot> {
  return apiClient.post<WorkloadSnapshot>(
    CAPACITY_ENDPOINTS.projectResources.workloadSnapshots(projectId),
    body ?? {}
  )
}
