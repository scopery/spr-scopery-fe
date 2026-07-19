import type { JoinRequestStatus } from './enums/join-request.enum'

export interface JoinRequest {
  id: string
  workspaceId: string
  requestedByUserId: string
  message: string | null
  status: JoinRequestStatus
  reviewNote: string | null
  reviewedByUserId: string | null
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

/** Locally tracked request for “My join requests” (no list-mine API yet). */
export interface MyJoinRequestRecord {
  id: string
  workspaceId: string
  workspaceCode?: string | null
  message: string | null
  status: JoinRequestStatus
  createdAt: string
}
