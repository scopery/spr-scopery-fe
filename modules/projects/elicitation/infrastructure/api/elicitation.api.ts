import { apiClient, ensureCsrfToken } from '@/shared/lib/apiClient'
import { ELICITATION_ENDPOINTS } from './endpoints'
import type {
  AnswerQuestionPayload,
  ElicitationQuestion,
  ElicitationRound,
  ElicitationSession,
  ElicitationSuggestion,
  ElicitationSuggestionItem,
  ScopeLockResponse,
  ScopeTreeResponse,
  StartElicitationSessionPayload,
  SubmitRoundResponse,
  UpdateSuggestionItemChangesPayload,
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
): Promise<ElicitationSession> {
  return apiClient.post<ElicitationSession>(
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

export async function checkActiveLock(
  projectId: string,
  scopePackageId: string
): Promise<ScopeLockResponse> {
  return apiClient.get<ScopeLockResponse>(
    ELICITATION_ENDPOINTS.sessions.activeLock(projectId, scopePackageId)
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

/**
 * SSE stream: generates next round of questions.
 * Calls onQuestion for each streamed question, onRound once when the round is finalized.
 */
export function streamGenerateRound(
  projectId: string,
  sessionId: string,
  onQuestion: (q: ElicitationQuestion) => void,
  onRound: (r: ElicitationRound) => void,
  onError: (err: Error) => void,
  signal?: AbortSignal
): void {
  void (async () => {
    await ensureCsrfToken()

    const csrf =
      typeof document !== 'undefined'
        ? (document.cookie
            .split('; ')
            .find((c) => c.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ?? null)
        : null

    const url = ELICITATION_ENDPOINTS.rounds.generate(projectId, sessionId)
    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'text/event-stream',
          ...(csrf ? { 'X-XSRF-TOKEN': decodeURIComponent(csrf) } : {}),
        },
        signal,
      })
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        onError(err instanceof Error ? err : new Error('Network error'))
      }
      return
    }

    if (!res.ok) {
      const text = await res.text()
      onError(new Error(text || `HTTP ${res.status}`))
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          let eventName = ''
          let eventData = ''
          for (const line of chunk.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim()
            else if (line.startsWith('data:')) eventData = line.slice(5).trim()
          }
          if (eventName === 'error') {
            onError(new Error(eventData || 'Generation failed'))
            return
          }
          if (eventName === 'question' && eventData) {
            try {
              onQuestion(JSON.parse(eventData) as ElicitationQuestion)
            } catch { /* skip malformed */ }
          }
          if (eventName === 'round' && eventData) {
            try {
              onRound(JSON.parse(eventData) as ElicitationRound)
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        onError(err instanceof Error ? err : new Error('Stream error'))
      }
    }
  })()
}

export async function submitRound(
  projectId: string,
  sessionId: string,
  roundId: string
): Promise<SubmitRoundResponse> {
  return apiClient.post<SubmitRoundResponse>(
    ELICITATION_ENDPOINTS.rounds.submit(projectId, sessionId, roundId)
  )
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

export async function updateSuggestionItemChanges(
  itemId: string,
  payload: UpdateSuggestionItemChangesPayload
): Promise<ElicitationSuggestionItem> {
  return apiClient.patch<ElicitationSuggestionItem>(
    ELICITATION_ENDPOINTS.suggestionItems.changes(itemId),
    payload
  )
}

export async function getScopeTree(
  projectId: string,
  sessionId: string
): Promise<ScopeTreeResponse> {
  return apiClient.get<ScopeTreeResponse>(
    ELICITATION_ENDPOINTS.scopeTree.get(projectId, sessionId)
  )
}
