export {
  DOCUMENT_CONTENT_ENDPOINTS,
  DOCUMENT_ATTACHMENT_ENDPOINTS,
  DOCUMENT_COMMENT_ENDPOINTS,
  DOCUMENT_SUGGESTION_ENDPOINTS,
} from './api/endpoints'
export * as documentContentApi from './api/document-content.api'
export * as documentAttachmentApi from './api/document-attachment.api'
export * as documentCommentApi from './api/document-comment.api'
export * as documentSuggestionApi from './api/document-suggestion.api'
export { DocumentContentGateway } from './api/document-content.gateway'
export { useNativeDocumentEditor } from './hooks/useNativeDocumentEditor'
export { useDocumentAttachments } from './hooks/useDocumentAttachments'
export { useDocumentCommentThreads } from './hooks/useDocumentCommentThreads'
export { useDocumentSuggestions } from './hooks/useDocumentSuggestions'
export { useDocumentRevisionHistory } from './hooks/useDocumentRevisionHistory'
export { NativeDocumentEditorView } from './ui/NativeDocumentEditorView'
export { SaveConflictBanner } from './ui/SaveConflictBanner'
export { DocumentAutosaveIndicator } from './ui/DocumentAutosaveIndicator'
export { DocumentEditorRightPanel } from './ui/DocumentEditorRightPanel'
export { DocumentAttachmentsPanel } from './ui/DocumentAttachmentsPanel'
export { DocumentSubpagesPanel } from './ui/DocumentSubpagesPanel'
export { DocumentCommentsPanel } from './ui/DocumentCommentsPanel'
export { DocumentSuggestionsPanel } from './ui/DocumentSuggestionsPanel'
export { DocumentHistoryPanel } from './ui/DocumentHistoryPanel'
export { SyncedBlocksPanel } from './ui/SyncedBlocksPanel'
export { NativeTemplatePublishPanel } from './ui/NativeTemplatePublishPanel'
export { SmartBlocksPanel } from './ui/SmartBlocksPanel'
export { ClientVisibilityPanel } from './ui/ClientVisibilityPanel'
export { ResourceMentionsPanel } from './ui/ResourceMentionsPanel'
export { AiContextPanel } from './ui/AiContextPanel'
export { DocumentIndexingPanel } from './ui/DocumentIndexingPanel'
export { MentionAccessBanner } from './ui/MentionAccessBanner'
export { useSyncedBlocks } from './hooks/useSyncedBlocks'
export { useClientVisibility } from './hooks/useClientVisibility'
export { useResourceMentions } from './hooks/useResourceMentions'
export { useAiContext } from './hooks/useAiContext'
export { useMentionAccessCheck } from './hooks/useMentionAccessCheck'
export * as syncedBlockApi from './api/synced-block.api'
export * as nativeTemplateApi from './api/native-template.api'
export * as clientVisibilityApi from './api/client-visibility.api'
export * as resourceMentionApi from './api/resource-mention.api'
export * as aiContextApi from './api/ai-context.api'
export {
  SYNCED_BLOCK_ENDPOINTS,
  NATIVE_TEMPLATE_ENDPOINTS,
} from './api/reusable-content.endpoints'
export {
  CLIENT_VISIBILITY_ENDPOINTS,
  RESOURCE_REFERENCE_ENDPOINTS,
  AI_CONTEXT_ENDPOINTS,
} from './api/intelligence.endpoints'
export type { SyncedBlock, NativeTemplateVariableDef } from './model/reusable-content'
export type {
  ClientVisibilityValidation,
  ResourceTypeDefinition,
  ResolvedResource,
  AiContextResolutionResult,
} from './model/intelligence'
export {
  ContentRevisionType,
  DocumentContentMode,
  CONTENT_OPTIMISTIC_LOCK_CONFLICT,
  DOCUMENT_NATIVE_CONTENT_NOT_SUPPORTED,
} from './model/document-content'
export type {
  DocumentContentResponse,
  DocumentRevisionListItem,
  DocumentRevisionDetail,
  NativeEditorSaveStatus,
} from './model/document-content'
export type { DocumentAttachment, CreateAttachmentBody } from './model/document-attachment'
export type {
  DocumentCommentThread,
  DocumentSuggestion,
  EditorSidePanel,
} from './model/collaboration'
export { parseAstToPlateValue, plateValueToAst } from './model/ast-adapter'
