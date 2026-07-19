import { apiClient } from '@/shared/lib/apiClient'
import { JOIN_REQUEST_ENDPOINTS } from './endpoints'
import type {
  JoinRequest,
  SubmitJoinRequestPayload,
  SubmitJoinRequestByCodePayload,
  RejectJoinRequestPayload,
} from '../../domain/model/join-request'

export interface JoinRequestPageResponse {
  items: JoinRequest[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export async function submitJoinRequest(
  workspaceId: string,
  body: SubmitJoinRequestPayload
): Promise<JoinRequest> {
  return apiClient.post<JoinRequest>(JOIN_REQUEST_ENDPOINTS.submitDirect(workspaceId), body)
}

export async function submitJoinRequestByCode(
  body: SubmitJoinRequestByCodePayload
): Promise<JoinRequest> {
  return apiClient.post<JoinRequest>(JOIN_REQUEST_ENDPOINTS.submitByCode(), body)
}

export async function listJoinRequests(
  workspaceId: string,
  params?: { status?: string }
): Promise<JoinRequestPageResponse> {
  return apiClient.get<JoinRequestPageResponse>(JOIN_REQUEST_ENDPOINTS.list(workspaceId, params))
}

export async function approveJoinRequest(
  workspaceId: string,
  requestId: string
): Promise<JoinRequest> {
  return apiClient.patch<JoinRequest>(JOIN_REQUEST_ENDPOINTS.approve(workspaceId, requestId))
}

export async function rejectJoinRequest(
  workspaceId: string,
  requestId: string,
  body: RejectJoinRequestPayload
): Promise<JoinRequest> {
  return apiClient.patch<JoinRequest>(JOIN_REQUEST_ENDPOINTS.reject(workspaceId, requestId), body)
}

export async function cancelJoinRequest(workspaceId: string, requestId: string): Promise<void> {
  await apiClient.delete<void>(JOIN_REQUEST_ENDPOINTS.cancel(workspaceId, requestId), {
    parseJson: false,
  })
}
