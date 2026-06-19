import { AI_ENDPOINTS } from '../../project/api/ai-endpoints'
/**
 * AI question-generation API — project-scoped v2 endpoints.
 */

import { apiClient } from '@/shared/lib/apiClient'
import type {
  QuestionsCommitBody,
  QuestionsGenerateBody,
  QuestionsGenerateResponse,
} from '../model/ai-questions'

export type {
  AiQuestionsGenerateEngine,
  GeneratedQuestionItem,
  QuestionsCommitBody,
  QuestionsCommitEdit,
  QuestionsCommitPatch,
  QuestionsGenerateBody,
  QuestionsGenerateResponse,
} from '../model/ai-questions'

export async function questionsGenerate(
  orgId: string,
  projectId: string,
  body: QuestionsGenerateBody
): Promise<QuestionsGenerateResponse> {
  const url = AI_ENDPOINTS.questionsGenerate(orgId, projectId)
  return apiClient.post<QuestionsGenerateResponse>(url, body)
}

export async function questionsCommit(
  orgId: string,
  projectId: string,
  body: QuestionsCommitBody
): Promise<void> {
  const url = AI_ENDPOINTS.questionsCommit(orgId, projectId)
  return apiClient.post<void>(url, body)
}
