export type {
  AIStructuredSection,
  AIStructuredPreview,
  AIPreviewResponse,
  AIDocumentCreatedResponse,
  RelatedDocumentItem,
  DocumentAIMetadata,
} from '../api/ai-document-intelligence.api'

import type { DocumentOriginType } from '@/modules/documents'
import type { AIStructuredPreview } from '../api/ai-document-intelligence.api'

export interface AIGeneratedBadgeProps {
  generatedByAI?: boolean
  originType?: DocumentOriginType
}

export interface AIPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: AIStructuredPreview | null
  warnings?: string[]
  loading?: boolean
  onSave?: () => void
  saveLabel?: string
}

export interface DocumentAIPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  documentTitle: string
  generatedByAI?: boolean
  originType?: DocumentOriginType
  permissions: {
    canSummarizeDocument: boolean
    canFindRelatedDocuments: boolean
    canViewAIMetadata: boolean
  }
}

export interface RelatedDocumentsPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  enabled: boolean
}

export interface ProjectAIActionsMenuProps {
  orgId: string
  projectId: string
  permissions: {
    canGenerateProjectBrief: boolean
    canSummarizeProjectDocuments: boolean
    canSaveQASummary: boolean
    canSaveClarityReport: boolean
    canSaveReadinessReport: boolean
  }
}
