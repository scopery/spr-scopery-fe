import type {
  AiCapabilityLevel,
  AiConversationStatus,
  AiConversationType,
  AiMessageRole,
  AiMessageStatus,
} from '../enums/ai-assistant.enum'

export interface AiConversation {
  id: string
  workspaceId?: string | null
  projectId?: string | null
  ownerUserId?: string | null
  conversationType?: AiConversationType | string
  capabilityLevel?: AiCapabilityLevel | string
  status?: AiConversationStatus | string
  title: string | null
  lastMessageAt?: string | null
  createdAt: string
  updatedAt?: string
  /** @deprecated prefer workspaceId / projectId */
  scopeType?: string | null
  scopeId?: string | null
}

/** Client-side grounding target sent with each message (BE SendMessageRequest). */
export interface AiChatDocumentContext {
  projectId: string
  documentId: string
  title: string
}

export interface AiMessage {
  id: string
  conversationId: string
  turnId?: string | null
  sequenceInConversation?: number
  role: AiMessageRole | string
  status?: AiMessageStatus | string
  content: string | null
  responseMode?: string | null
  inputTokenCount?: number | null
  outputTokenCount?: number | null
  createdAt: string
  updatedAt?: string
}

export interface AiConversationListResponse {
  items: AiConversation[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  first?: boolean
  last?: boolean
}
