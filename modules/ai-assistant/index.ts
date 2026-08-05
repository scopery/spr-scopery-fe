/** AI Assistant bounded-context facade. */

export { AiAssistantView } from './presentation/ui/AiAssistantView'
export { useAiAssistant } from './presentation/hooks/useAiAssistant'
export { useAiMessageStream } from './presentation/hooks/useAiMessageStream'
export { useAiTextRewrite } from './presentation/hooks/useAiTextRewrite'
export type {
  AiTextRewritePhase,
  AiTextRewriteDocumentKind,
} from './presentation/hooks/useAiTextRewrite'
export { AiTextareaEditToolbar } from './presentation/ui/AiTextareaEditToolbar'
export { useContextualGuide } from './presentation/hooks/useContextualGuide'
export type {
  AiConversation,
  AiMessage,
  AiChatDocumentContext,
  AiConversationListResponse,
} from './domain/model/conversation'
export * as aiAssistantApi from './infrastructure/api/ai-assistant.api'
export { AI_ASSISTANT_ENDPOINTS } from './infrastructure/api/endpoints'
export { WAVE5_AI_PERMISSIONS } from './domain/enums/wave5-permissions.enum'
