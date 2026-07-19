import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type {
  CreateTagAssignmentPayload,
  CreateTagPayload,
  TagAssignment,
  TagDefinition,
} from '../../domain/model/tag'

export async function listTags(workspaceId: string): Promise<TagDefinition[]> {
  return apiClient.get<TagDefinition[]>(CONFIGURATION_ENDPOINTS.tags.list(workspaceId))
}

export async function getTag(workspaceId: string, tagId: string): Promise<TagDefinition> {
  return apiClient.get<TagDefinition>(CONFIGURATION_ENDPOINTS.tags.get(workspaceId, tagId))
}

export async function createTag(
  workspaceId: string,
  body: CreateTagPayload
): Promise<TagDefinition> {
  return apiClient.post<TagDefinition>(CONFIGURATION_ENDPOINTS.tags.create(workspaceId), body)
}

export async function listTagAssignments(workspaceId: string): Promise<TagAssignment[]> {
  return apiClient.get<TagAssignment[]>(CONFIGURATION_ENDPOINTS.tagAssignments.list(workspaceId))
}

export async function createTagAssignment(
  workspaceId: string,
  body: CreateTagAssignmentPayload
): Promise<TagAssignment> {
  return apiClient.post<TagAssignment>(
    CONFIGURATION_ENDPOINTS.tagAssignments.create(workspaceId),
    body
  )
}

export async function deleteTagAssignment(
  workspaceId: string,
  assignmentId: string
): Promise<void> {
  await apiClient.delete<void>(CONFIGURATION_ENDPOINTS.tagAssignments.delete(workspaceId, assignmentId))
}
