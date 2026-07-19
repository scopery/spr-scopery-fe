import type { PageParams } from './common'
import type { RateCardEntityStatus } from '../enums/rate-card.enum'

export interface MemberCostRole {
  id: string
  workspaceId: string
  workspaceMemberId: string
  userId: string | null
  costRoleId: string
  isDefault: boolean
  effectiveFrom: string
  effectiveTo: string | null
  status: RateCardEntityStatus | string
  archivedAt: string | null
  archivedBy: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateMemberCostRolePayload {
  workspaceId: string
  workspaceMemberId: string
  costRoleId: string
  isDefault?: boolean
  effectiveFrom: string
  effectiveTo?: string
}

export interface UpdateMemberCostRolePayload {
  costRoleId: string
  isDefault?: boolean
  effectiveFrom: string
  effectiveTo?: string | null
}

export interface MemberCostRoleSearchParams extends PageParams {
  workspaceId: string
  workspaceMemberId?: string
  userId?: string
  costRoleId?: string
  status?: string
  effectiveDate?: string
}
