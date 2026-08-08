import { apiClient } from '@/shared/lib/apiClient'
import { ELICITATION_ENDPOINTS } from './endpoints'
import type {
  AnswerQuestionPayload,
  ElicitationQuestion,
  ElicitationRound,
  ElicitationSession,
  ElicitationSuggestion,
  StartElicitationSessionPayload,
} from '../../domain/model/elicitation'

export async function listSessions(projectId: string): Promise<ElicitationSession[]> {
  const res = await apiClient.get<ElicitationSession[] | { items?: ElicitationSession[] }>(
    ELICITATION_ENDPOINTS.sessions.list(projectId)
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function startSession(
  projectId: string,
  body: StartElicitationSessionPayload
): Promise<ElicitationSession> {
  return apiClient.post<ElicitationSession>(ELICITATION_ENDPOINTS.sessions.start(projectId), body)
}

export async function getSession(
  projectId: string,
  sessionId: string
): Promise<ElicitationSession> {
  return apiClient.get<ElicitationSession>(ELICITATION_ENDPOINTS.sessions.get(projectId, sessionId))
}

export async function closeSession(
  projectId: string,
  sessionId: string
): Promise<ElicitationRound> {
  return apiClient.post<ElicitationRound>(
    ELICITATION_ENDPOINTS.sessions.close(projectId, sessionId)
  )
}

export async function cancelSession(
  projectId: string,
  sessionId: string
): Promise<ElicitationSession> {
  return apiClient.post<ElicitationSession>(
    ELICITATION_ENDPOINTS.sessions.cancel(projectId, sessionId)
  )
}

export async function listQuestions(
  projectId: string,
  sessionId: string
): Promise<ElicitationQuestion[]> {
  const res = await apiClient.get<ElicitationQuestion[] | { items?: ElicitationQuestion[] }>(
    ELICITATION_ENDPOINTS.questions.list(projectId, sessionId)
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function generateQuestions(
  projectId: string,
  sessionId: string
): Promise<ElicitationQuestion[]> {
  const res = await apiClient.post<ElicitationQuestion[] | { items?: ElicitationQuestion[] }>(
    ELICITATION_ENDPOINTS.questions.generate(projectId, sessionId)
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function evaluateAnswers(
  projectId: string,
  sessionId: string
): Promise<ElicitationQuestion[]> {
  const res = await apiClient.post<ElicitationQuestion[] | { items?: ElicitationQuestion[] }>(
    ELICITATION_ENDPOINTS.questions.evaluate(projectId, sessionId)
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function answerQuestion(
  projectId: string,
  sessionId: string,
  questionId: string,
  body: AnswerQuestionPayload
): Promise<ElicitationQuestion> {
  return apiClient.patch<ElicitationQuestion>(
    ELICITATION_ENDPOINTS.questions.answer(projectId, sessionId, questionId),
    body
  )
}

export async function skipQuestion(
  projectId: string,
  sessionId: string,
  questionId: string
): Promise<ElicitationQuestion> {
  return apiClient.patch<ElicitationQuestion>(
    ELICITATION_ENDPOINTS.questions.skip(projectId, sessionId, questionId)
  )
}

export async function listRounds(
  projectId: string,
  sessionId: string
): Promise<ElicitationRound[]> {
  const res = await apiClient.get<ElicitationRound[] | { items?: ElicitationRound[] }>(
    ELICITATION_ENDPOINTS.rounds.list(projectId, sessionId)
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function submitRound(roundId: string): Promise<ElicitationRound> {
  return apiClient.post<ElicitationRound>(ELICITATION_ENDPOINTS.rounds.submit(roundId))
}

export async function generateSuggestions(roundId: string): Promise<ElicitationSuggestion> {
  return apiClient.post<ElicitationSuggestion>(ELICITATION_ENDPOINTS.rounds.suggestions(roundId))
}

export async function getSuggestions(roundId: string): Promise<ElicitationSuggestion> {
  return apiClient.get<ElicitationSuggestion>(ELICITATION_ENDPOINTS.rounds.suggestions(roundId))
}

export async function approveSuggestionItem(itemId: string): Promise<unknown> {
  return apiClient.post(ELICITATION_ENDPOINTS.suggestionItems.approve(itemId))
}

export async function rejectSuggestionItem(itemId: string): Promise<unknown> {
  return apiClient.post(ELICITATION_ENDPOINTS.suggestionItems.reject(itemId))
}
