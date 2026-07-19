import { apiClient } from '@/shared/lib/apiClient'
import { RATE_CARD_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../domain/model/common'
import type {
  CreateMemberCostRolePayload,
  MemberCostRole,
  MemberCostRoleSearchParams,
  UpdateMemberCostRolePayload,
} from '../../domain/model/member-cost-role'

export async function listMemberCostRoles(
  params: MemberCostRoleSearchParams
): Promise<PageResponse<MemberCostRole>> {
  return apiClient.get<PageResponse<MemberCostRole>>(
    RATE_CARD_ENDPOINTS.memberCostRoles.list(params)
  )
}

export async function getMemberCostRole(assignmentId: string): Promise<MemberCostRole> {
  return apiClient.get<MemberCostRole>(RATE_CARD_ENDPOINTS.memberCostRoles.get(assignmentId))
}

export async function createMemberCostRole(
  body: CreateMemberCostRolePayload
): Promise<MemberCostRole> {
  return apiClient.post<MemberCostRole>(RATE_CARD_ENDPOINTS.memberCostRoles.create(), body)
}

export async function updateMemberCostRole(
  assignmentId: string,
  body: UpdateMemberCostRolePayload
): Promise<MemberCostRole> {
  return apiClient.put<MemberCostRole>(
    RATE_CARD_ENDPOINTS.memberCostRoles.update(assignmentId),
    body
  )
}

export async function archiveMemberCostRole(assignmentId: string): Promise<MemberCostRole> {
  return apiClient.patch<MemberCostRole>(RATE_CARD_ENDPOINTS.memberCostRoles.archive(assignmentId))
}
