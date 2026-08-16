import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { AI_ASSISTANT_ENDPOINTS } from './endpoints'
import type {
  AiConversation,
  AiConversationListResponse,
  AiMessage,
} from '../../domain/model/conversation'

export async function listConversations(params?: {
  page?: number
  size?: number
}): Promise<AiConversationListResponse> {
  const res = await apiClient.get<ListPayload<AiConversation>>(AI_ASSISTANT_ENDPOINTS.conversations(params))
  return normalizeItemList(res)
}

export async function getConversation(id: string): Promise<AiConversation> {
  return apiClient.get(AI_ASSISTANT_ENDPOINTS.conversation(id))
}

export async function createConversation(body: {
  workspaceId?: string
  projectId?: string | null
  title?: string | null
  conversationType?: string
  capabilityLevel?: string
  assistantAgentId?: string | null
}): Promise<AiConversation> {
  return apiClient.post(AI_ASSISTANT_ENDPOINTS.conversations(), {
    workspaceId: body.workspaceId ?? null,
    projectId: body.projectId ?? null,
    conversationType: body.conversationType ?? 'GENERAL_GUIDE',
    capabilityLevel: body.capabilityLevel ?? 'CONTEXTUAL_ANSWER',
    assistantAgentId: body.assistantAgentId ?? null,
    title: body.title ?? null,
  })
}

export async function patchConversationTitle(
  id: string,
  title: string
): Promise<AiConversation> {
  return apiClient.patch(AI_ASSISTANT_ENDPOINTS.patchTitle(id), { title })
}

export async function archiveConversation(id: string): Promise<void> {
  await apiClient.post(AI_ASSISTANT_ENDPOINTS.archive(id), undefined, {
    parseJson: false,
  })
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(AI_ASSISTANT_ENDPOINTS.deleteConversation(id), {
    parseJson: false,
  })
}

export async function createMessage(
  conversationId: string,
  body: {
    content: string
    idempotencyKey?: string | null
    pageCode?: string | null
    entityType?: string | null
    entityId?: string | null
    sourceProjectId?: string | null
  }
): Promise<{
  conversationId?: string
  userMessageId?: string
  assistantMessageId?: string
  turnId?: string
  messageId: string
  streamUrl?: string
}> {
  const res = await apiClient.post<{
    conversationId?: string
    userMessageId?: string
    user_message_id?: string
    assistantMessageId?: string
    assistant_message_id?: string
    turnId?: string
    turn_id?: string
    messageId?: string
    message_id?: string
    streamUrl?: string
    stream_url?: string
  }>(AI_ASSISTANT_ENDPOINTS.messages(conversationId), {
    content: body.content,
    idempotencyKey: body.idempotencyKey ?? null,
    pageCode: body.pageCode ?? null,
    entityType: body.entityType ?? null,
    entityId: body.entityId ?? null,
    sourceProjectId: body.sourceProjectId ?? null,
  })
  const assistantMessageId =
    res.assistantMessageId ?? res.assistant_message_id ?? res.messageId ?? res.message_id
  return {
    conversationId: res.conversationId,
    userMessageId: res.userMessageId ?? res.user_message_id,
    assistantMessageId,
    turnId: res.turnId ?? res.turn_id,
    messageId: assistantMessageId ?? res.userMessageId ?? res.user_message_id ?? '',
    streamUrl: res.streamUrl ?? res.stream_url,
  }
}

export function resolveMessageStreamUrl(result: {
  streamUrl?: string
  assistantMessageId?: string
  messageId?: string
}): string | null {
  if (result.streamUrl) return result.streamUrl
  const id = result.assistantMessageId ?? result.messageId
  return id ? AI_ASSISTANT_ENDPOINTS.messageStream(id) : null
}

export async function getMessage(messageId: string): Promise<AiMessage> {
  return apiClient.get(AI_ASSISTANT_ENDPOINTS.message(messageId))
}

export async function cancelMessage(messageId: string): Promise<void> {
  await apiClient.post(AI_ASSISTANT_ENDPOINTS.cancelMessage(messageId), undefined, {
    parseJson: false,
  })
}

export async function listMessages(
  conversationId: string,
  params?: { page?: number; size?: number }
): Promise<{ items: AiMessage[] }> {
  const res = await apiClient.get<ListPayload<AiMessage>>(AI_ASSISTANT_ENDPOINTS.messages(conversationId, params))
  return normalizeItemList(res)
}

export async function listSuggestedQuestions(params?: {
  pageCode?: string
  entityType?: string
  locale?: string
}): Promise<{
  items: Array<
    | { id?: string; question?: string; questionText?: string; code?: string; pageCode?: string }
    | string
  >
}> {
  const res = await apiClient.get<
    ListPayload<
      | { id?: string; question?: string; questionText?: string; code?: string; pageCode?: string }
      | string
    >
  >(AI_ASSISTANT_ENDPOINTS.suggestedQuestions(params))
  return normalizeItemList(res)
}

export async function explainPage(body: {
  workspaceId?: string
  projectId?: string | null
  pageCode: string
  locale?: string
}): Promise<{ messageId?: string; assistantMessageId?: string; streamUrl?: string }> {
  return apiClient.post(AI_ASSISTANT_ENDPOINTS.explainPage(), {
    workspaceId: body.workspaceId ?? null,
    projectId: body.projectId ?? null,
    pageCode: body.pageCode,
    locale: body.locale ?? 'en-US',
  })
}

export async function explainField(body: {
  workspaceId?: string
  projectId?: string | null
  pageCode: string
  fieldCode: string
  locale?: string
}): Promise<{ messageId?: string; assistantMessageId?: string; streamUrl?: string }> {
  return apiClient.post(AI_ASSISTANT_ENDPOINTS.explainField(), {
    workspaceId: body.workspaceId ?? null,
    projectId: body.projectId ?? null,
    pageCode: body.pageCode,
    fieldCode: body.fieldCode,
    locale: body.locale ?? 'en-US',
  })
}

export async function explainDisabledAction(body: {
  workspaceId?: string
  projectId?: string | null
  pageCode: string
  actionCode: string
  locale?: string
}): Promise<{ messageId?: string; assistantMessageId?: string; streamUrl?: string }> {
  return apiClient.post(AI_ASSISTANT_ENDPOINTS.explainDisabledAction(), {
    workspaceId: body.workspaceId ?? null,
    projectId: body.projectId ?? null,
    pageCode: body.pageCode,
    actionCode: body.actionCode,
    locale: body.locale ?? 'en-US',
  })
}

export async function submitFeedback(body: {
  conversationId: string
  messageId: string
  rating: 'THUMBS_UP' | 'THUMBS_DOWN'
  reasonCode?: string | null
  comment?: string
}): Promise<{ id: string; createdAt?: string }> {
  return apiClient.post(AI_ASSISTANT_ENDPOINTS.feedbacks(), {
    conversationId: body.conversationId,
    messageId: body.messageId,
    rating: body.rating,
    reasonCode: body.reasonCode ?? null,
    comment: body.comment ?? null,
  })
}
