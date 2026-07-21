/** AI Assistant bounded-context facade. */

export { AiAssistantView } from './presentation/ui/AiAssistantView'
export { useAiAssistant } from './presentation/hooks/useAiAssistant'
export { useAiMessageStream } from './presentation/hooks/useAiMessageStream'
export { useContextualGuide } from './presentation/hooks/useContextualGuide'
export type {
  AiConversation,
  AiMessage,
  AiChatDocumentContext,
  AiConversationListResponse,
} from './domain/model/conversation'
export * as aiAssistantApi from './infrastructure/api/ai-assistant.api'
