import { SESSION_ENDPOINTS } from './endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  SessionListResponse,
  SessionDetail,
  AnswerItem,
  PutAnswersPayload,
  SessionProgress,
} from '../model/session'

export type {
  SessionListItem,
  SessionListResponse,
  SessionDetail,
  AnswerItem,
  SessionProgress,
  PutAnswersPayload,
} from '../model/session'

export async function listSessions(
  orgId: string,
  projectId: string,
  params?: { limit?: number; offset?: number }
): Promise<SessionListResponse> {
  const url = SESSION_ENDPOINTS.list(orgId, projectId, params)
  return apiClient.get<SessionListResponse>(url)
}

export async function createSession(
  orgId: string,
  projectId: string,
  body: { name: string }
): Promise<SessionDetail> {
  const url = SESSION_ENDPOINTS.create(orgId, projectId)
  return apiClient.post<SessionDetail>(url, body)
}

export async function getSession(
  orgId: string,
  projectId: string,
  sessionId: string
): Promise<SessionDetail> {
  const url = SESSION_ENDPOINTS.get(orgId, projectId, sessionId)
  return apiClient.get<SessionDetail>(url)
}

export async function putAnswers(
  orgId: string,
  projectId: string,
  sessionId: string,
  payload: PutAnswersPayload
): Promise<{ answers: AnswerItem[] }> {
  const url = SESSION_ENDPOINTS.putAnswers(orgId, projectId, sessionId)
  return apiClient.put<{ answers: AnswerItem[] }>(url, payload)
}

export async function submitSession(
  orgId: string,
  projectId: string,
  sessionId: string
): Promise<SessionDetail> {
  const url = SESSION_ENDPOINTS.submit(orgId, projectId, sessionId)
  return apiClient.post<SessionDetail>(url)
}

export async function getSessionProgress(
  orgId: string,
  projectId: string,
  sessionId: string
): Promise<SessionProgress> {
  const url = SESSION_ENDPOINTS.progress(orgId, projectId, sessionId)
  return apiClient.get<SessionProgress>(url)
}

export async function lockSession(
  orgId: string,
  projectId: string,
  sessionId: string
): Promise<SessionDetail> {
  const url = SESSION_ENDPOINTS.lock(orgId, projectId, sessionId)
  return apiClient.post<SessionDetail>(url)
}

export async function reopenSession(
  orgId: string,
  projectId: string,
  sessionId: string
): Promise<SessionDetail> {
  const url = SESSION_ENDPOINTS.reopen(orgId, projectId, sessionId)
  return apiClient.post<SessionDetail>(url)
}

export async function createSessionFromRevision(
  orgId: string,
  projectId: string,
  body: { revision_id: string; name?: string }
): Promise<SessionDetail> {
  const url = SESSION_ENDPOINTS.fromRevision(orgId, projectId)
  const res = await apiClient.post<
    SessionDetail | { session: SessionDetail; prefilled_count?: number }
  >(url, body)
  if (res && typeof res === 'object' && 'session' in res && res.session) return res.session
  return res as SessionDetail
}
