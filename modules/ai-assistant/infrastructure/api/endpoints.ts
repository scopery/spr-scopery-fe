import { getApiOrigin } from '@/shared/lib/api-paths'

/** BE maps AI Assistant under `/api/v1` (AiAssistantApiPaths). Do not rewrite to unversioned. */
const AI_ASSISTANT_BASE = `${getApiOrigin()}/api/v1/ai-assistant`

function withPageQuery(
  path: string,
  params?: { page?: number; size?: number }
): string {
  const p = new URLSearchParams()
  if (params?.page != null) p.set('page', String(params.page))
  if (params?.size != null) p.set('size', String(params.size))
  const q = p.toString()
  return path + (q ? `?${q}` : '')
}

export const AI_ASSISTANT_ENDPOINTS = {
  conversations: (params?: { page?: number; size?: number }) =>
    withPageQuery(`${AI_ASSISTANT_BASE}/conversations`, params),
  conversation: (id: string) => `${AI_ASSISTANT_BASE}/conversations/${id}`,
  patchTitle: (id: string) => `${AI_ASSISTANT_BASE}/conversations/${id}/title`,
  archive: (id: string) => `${AI_ASSISTANT_BASE}/conversations/${id}/archive`,
  deleteConversation: (id: string) => `${AI_ASSISTANT_BASE}/conversations/${id}`,

  messages: (
    conversationId: string,
    params?: { page?: number; size?: number }
  ) =>
    withPageQuery(
      `${AI_ASSISTANT_BASE}/conversations/${conversationId}/messages`,
      params
    ),
  message: (messageId: string) => `${AI_ASSISTANT_BASE}/messages/${messageId}`,
  messageStream: (messageId: string) =>
    `${AI_ASSISTANT_BASE}/messages/${messageId}/stream`,
  cancelMessage: (messageId: string) =>
    `${AI_ASSISTANT_BASE}/messages/${messageId}/cancel`,

  suggestedQuestions: (params?: {
    pageCode?: string
    entityType?: string
    locale?: string
  }) => {
    const q = new URLSearchParams()
    if (params?.pageCode) q.set('pageCode', params.pageCode)
    if (params?.entityType) q.set('entityType', params.entityType)
    if (params?.locale) q.set('locale', params.locale)
    const qs = q.toString()
    return (
      `${AI_ASSISTANT_BASE}/guides/suggested-questions` + (qs ? `?${qs}` : '')
    )
  },
  explainPage: () => `${AI_ASSISTANT_BASE}/guides/explain-page`,
  explainField: () => `${AI_ASSISTANT_BASE}/guides/explain-field`,
  explainDisabledAction: () =>
    `${AI_ASSISTANT_BASE}/guides/explain-disabled-action`,

  feedbacks: () => `${AI_ASSISTANT_BASE}/feedbacks`,
} as const
