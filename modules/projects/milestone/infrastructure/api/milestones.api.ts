import { apiClient } from '@/shared/lib/apiClient'
import { MILESTONE_ENDPOINTS } from './endpoints'
import type { CreateMilestonePayload, Milestone, UpdateMilestonePayload } from '../../domain/model/milestone'

export async function listMilestones(projectId: string): Promise<Milestone[]> {
  return apiClient.get<Milestone[]>(MILESTONE_ENDPOINTS.list(projectId))
}

export async function getMilestone(projectId: string, milestoneId: string): Promise<Milestone> {
  return apiClient.get<Milestone>(MILESTONE_ENDPOINTS.get(projectId, milestoneId))
}

export async function createMilestone(
  projectId: string,
  body: CreateMilestonePayload
): Promise<Milestone> {
  return apiClient.post<Milestone>(MILESTONE_ENDPOINTS.create(projectId), body)
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  body: UpdateMilestonePayload
): Promise<Milestone> {
  return apiClient.patch<Milestone>(MILESTONE_ENDPOINTS.update(projectId, milestoneId), body)
}

export async function achieveMilestone(
  projectId: string,
  milestoneId: string
): Promise<Milestone> {
  return apiClient.post<Milestone>(MILESTONE_ENDPOINTS.achieve(projectId, milestoneId))
}

export async function archiveMilestone(
  projectId: string,
  milestoneId: string
): Promise<Milestone> {
  return apiClient.post<Milestone>(MILESTONE_ENDPOINTS.archive(projectId, milestoneId))
}
