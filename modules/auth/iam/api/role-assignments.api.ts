import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type {
  CreateRoleAssignmentPayload,
  IamPageResponse,
  IamRoleAssignment,
  SearchRoleAssignmentsParams,
} from '../model'

export async function searchRoleAssignments(
  params?: SearchRoleAssignmentsParams
): Promise<IamPageResponse<IamRoleAssignment>> {
  return apiClient.get<IamPageResponse<IamRoleAssignment>>(
    IAM_ENDPOINTS.roleAssignments.search(params)
  )
}

export async function getRoleAssignment(assignmentId: string): Promise<IamRoleAssignment> {
  return apiClient.get<IamRoleAssignment>(IAM_ENDPOINTS.roleAssignments.get(assignmentId))
}

export async function createRoleAssignment(
  body: CreateRoleAssignmentPayload
): Promise<IamRoleAssignment> {
  return apiClient.post<IamRoleAssignment>(IAM_ENDPOINTS.roleAssignments.create(), body)
}

export async function activateRoleAssignment(
  assignmentId: string
): Promise<IamRoleAssignment> {
  return apiClient.patch<IamRoleAssignment>(IAM_ENDPOINTS.roleAssignments.activate(assignmentId))
}

export async function deactivateRoleAssignment(
  assignmentId: string
): Promise<IamRoleAssignment> {
  return apiClient.patch<IamRoleAssignment>(IAM_ENDPOINTS.roleAssignments.deactivate(assignmentId))
}
