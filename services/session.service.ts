/**
 * Session service — v2 API
 */

import { SESSION_ENDPOINTS } from '@/constants/endpoints'

export const SESSION_STATUS_LABEL: Record<'in_progress' | 'submitted' | 'locked', string> = {
  in_progress: 'In progress',
  submitted: 'Submitted',
  locked: 'Locked',
}
import { apiClient } from '@/shared/lib/apiClient'
import type { ProjectQuestion } from '@/services/project.service'

export interface SessionListItem {
  id: string
  project_id: string
  name: string
  status: 'in_progress' | 'submitted' | 'locked'
  created_by: string
  created_at: string
  submitted_at: string | null
}

export interface SessionListResponse {
  items: SessionListItem[]
  page: { limit: number; offset: number; total: number }
}

export interface AnswerItem {
  session_id: string
  question_id: string
  answer_status: 'answered' | 'skipped' | 'na'
  value: unknown
  skip_reason: string | null
  answered_by: string
  answered_at: string
}

export interface SessionDetail {
  id: string
  project_id: string
  name: string
  status: 'in_progress' | 'submitted' | 'locked'
  created_by: string
  created_at: string
  submitted_at: string | null
  questions: ProjectQuestion[]
  answers: AnswerItem[]
}

export interface PutAnswersPayload {
  answers: Array<{
    question_id: string
    answer_status: 'answered' | 'skipped' | 'na'
    value: unknown
    skip_reason?: string | null
  }>
}

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

export interface SessionProgress {
  total: number
  answered: number
  skipped: number
  na: number
  required_missing: number
  required_total: number
  required_answered: number
  optional_total: number
  optional_answered: number
  coverage_score: number
  coverage_percent: number
  coverage_label: string
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

/** Response can be SessionDetail or { session: SessionDetail, prefilled_count?: number } */
export async function createSessionFromRevision(
  orgId: string,
  projectId: string,
  body: { revision_id: string; name?: string }
): Promise<SessionDetail> {
  const url = SESSION_ENDPOINTS.fromRevision(orgId, projectId)
  const res = await apiClient.post<SessionDetail | { session: SessionDetail; prefilled_count?: number }>(url, body)
  if (res && typeof res === 'object' && 'session' in res && res.session) return res.session
  return res as SessionDetail
}
