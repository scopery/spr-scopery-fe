export { DocumentAIPanel } from './presentation/ui/DocumentAIPanel'
export { AIGeneratedBadge, originLabel } from './presentation/ui/AIGeneratedBadge'
export { AIPreviewDialog } from './presentation/ui/AIPreviewDialog'
export { useDocumentAIPanel } from './presentation/hooks/useDocumentAIPanel'
export type {
  AIStructuredSection,
  AIStructuredPreview,
  AIPreviewResponse,
  AIDocumentCreatedResponse,
  RelatedDocumentItem,
  DocumentAIMetadata,
  DocumentAIPanelProps,
  AIGeneratedBadgeProps,
  AIPreviewDialogProps,
  RelatedDocumentsPanelProps,
  ProjectAIActionsMenuProps,
} from './domain/model/ai-document-intelligence'
export * as aiDocumentIntelligenceApi from './infrastructure/api/ai-document-intelligence.api'
