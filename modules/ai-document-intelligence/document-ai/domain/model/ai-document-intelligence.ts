import type { DocumentOriginType } from '@/modules/documents'

export interface AIStructuredSection {
  heading?: string
  body?: string
  bullets?: string[]
}

export interface AIStructuredPreview {
  title: string
  sections: AIStructuredSection[]
  assumptions?: string[]
}

export interface AIPreviewResponse {
  preview: AIStructuredPreview
  generationId: string | null
  warnings?: string[]
}

export interface AIDocumentCreatedResponse {
  document: { id: string; title: string; [key: string]: unknown }
  warnings?: string[]
}

export interface RelatedDocumentItem {
  document_id: string
  title: string
  document_type: string
  project_id: string | null
  project_name: string | null
  section_id: string | null
  section_name: string | null
  snippet: string
  reason: string
  score: number
}

export interface DocumentAIMetadata {
  generated_by_ai: boolean
  ai_metadata: Record<string, unknown> | null
  source_summary: Record<string, unknown> | null
  origin_type: string
  origin_id: string | null
}

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
