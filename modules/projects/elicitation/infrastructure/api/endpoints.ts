import { apiPath } from '@/shared/lib/api-paths'

export const ELICITATION_ENDPOINTS = {
  sessions: {
    list: (projectId: string) =>
      apiPath(`/v1/projects/${projectId}/elicitation-sessions`),
    start: (projectId: string) =>
      apiPath(`/v1/projects/${projectId}/elicitation-sessions`),
    get: (projectId: string, sessionId: string) =>
      apiPath(`/v1/projects/${projectId}/elicitation-sessions/${sessionId}`),
    close: (projectId: string, sessionId: string) =>
      apiPath(`/v1/projects/${projectId}/elicitation-sessions/${sessionId}/close`),
    cancel: (projectId: string, sessionId: string) =>
      apiPath(`/v1/projects/${projectId}/elicitation-sessions/${sessionId}/cancel`),
    activeLock: (projectId: string, scopePackageId: string) =>
      apiPath(
        `/v1/projects/${projectId}/elicitation-sessions/active-lock?scopePackageId=${scopePackageId}`
      ),
  },
  questions: {
    list: (projectId: string, sessionId: string) =>
      apiPath(`/v1/projects/${projectId}/elicitation-sessions/${sessionId}/questions`),
    answer: (projectId: string, sessionId: string, questionId: string) =>
      apiPath(
        `/v1/projects/${projectId}/elicitation-sessions/${sessionId}/questions/${questionId}/answer`
      ),
    skip: (projectId: string, sessionId: string, questionId: string) =>
      apiPath(
        `/v1/projects/${projectId}/elicitation-sessions/${sessionId}/questions/${questionId}/skip`
      ),
  },
  rounds: {
    list: (projectId: string, sessionId: string) =>
      apiPath(`/v1/projects/${projectId}/elicitation-sessions/${sessionId}/rounds`),
    get: (roundId: string) => apiPath(`/v1/elicitation-rounds/${roundId}`),
    generate: (projectId: string, sessionId: string) =>
      apiPath(
        `/v1/projects/${projectId}/elicitation-sessions/${sessionId}/rounds/generate`
      ),
    submit: (projectId: string, sessionId: string, roundId: string) =>
      apiPath(
        `/v1/projects/${projectId}/elicitation-sessions/${sessionId}/rounds/${roundId}/submit`
      ),
    suggestions: (roundId: string) =>
      apiPath(`/v1/elicitation-rounds/${roundId}/suggestions`),
  },
  suggestionItems: {
    approve: (itemId: string) =>
      apiPath(`/v1/elicitation-suggestion-items/${itemId}/approve`),
    reject: (itemId: string) =>
      apiPath(`/v1/elicitation-suggestion-items/${itemId}/reject`),
  },
  scopeTree: {
    get: (projectId: string, sessionId: string) =>
      apiPath(`/v1/projects/${projectId}/elicitation-sessions/${sessionId}/scope-tree`),
  },
} as const
