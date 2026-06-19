import { PROJECT_ENDPOINTS } from '../../project/api/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeQuestionTypeForApi } from '@/utils/questionType'
import type {
  ProjectQuestion,
  ProjectQuestionsResponse,
  CreateQuestionPayload,
} from '../model/questions'

export type {
  ProjectQuestion,
  ProjectQuestionsResponse,
  CreateQuestionPayload,
} from '../model/questions'

export async function getProjectQuestions(
  orgId: string,
  projectId: string
): Promise<ProjectQuestionsResponse> {
  const url = PROJECT_ENDPOINTS.questions(orgId, projectId)
  return apiClient.get<ProjectQuestionsResponse>(url)
}

export async function createProjectQuestion(
  orgId: string,
  projectId: string,
  body: CreateQuestionPayload
): Promise<ProjectQuestion> {
  const url = PROJECT_ENDPOINTS.questions(orgId, projectId)
  const payload = { ...body, q_type: normalizeQuestionTypeForApi(body.q_type) }
  return apiClient.post<ProjectQuestion>(url, payload)
}

export async function updateProjectQuestion(
  orgId: string,
  projectId: string,
  questionId: string,
  body: Partial<CreateQuestionPayload>
): Promise<ProjectQuestion> {
  const url = PROJECT_ENDPOINTS.question(orgId, projectId, questionId)
  const payload =
    body.q_type !== undefined ? { ...body, q_type: normalizeQuestionTypeForApi(body.q_type) } : body
  return apiClient.patch<ProjectQuestion>(url, payload)
}

export async function reorderProjectQuestions(
  orgId: string,
  projectId: string,
  body: { section: string; ordered_ids: string[] }
): Promise<void> {
  const url = PROJECT_ENDPOINTS.questionsReorder(orgId, projectId)
  return apiClient.post(url, body)
}

export async function archiveProjectQuestion(
  orgId: string,
  projectId: string,
  questionId: string
): Promise<void> {
  const url = PROJECT_ENDPOINTS.question(orgId, projectId, questionId)
  return apiClient.delete(url)
}
