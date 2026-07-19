import type { JoinRequestStatus } from '../enums/join-request.enum'

export interface JoinRequest {
  id: string
  workspaceId: string
  userId: string
  message: string | null
  status: JoinRequestStatus
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SubmitJoinRequestPayload {
  message?: string
}

export interface SubmitJoinRequestByCodePayload {
  workspaceId?: string
  workspaceCode?: string
  message?: string
}

export interface RejectJoinRequestPayload {
  reviewNote?: string
}
