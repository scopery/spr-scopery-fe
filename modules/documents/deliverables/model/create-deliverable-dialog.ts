import type {
  DeliverableEntryContext,
  DeliverablePreviewResult,
  DeliverableSourceEntityType,
  DeliverableTemplateListItem,
  DeliverableType,
} from '../model/document-deliverable-types'

export interface CreateDeliverableDialogProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: (documentId: string) => void
  entryContext?: DeliverableEntryContext
  initialDeliverableType?: DeliverableType
  initialSourceEntityType?: DeliverableSourceEntityType
  initialSourceEntityId?: string
  initialSelectedDocumentIds?: string[]
  selectedDocumentTitles?: string[]
  lockDeliverableType?: DeliverableType
}

export interface CreateDeliverableSelectOption {
  value: string
  label: string
}

export interface CreateDeliverableDialogViewProps {
  open: boolean
  onClose: () => void
  orgId: string
  projectId: string
  hasDocumentSet: boolean
  showDocumentSetPicker: boolean
  lockDeliverableType?: DeliverableType
  effectiveSource: DeliverableSourceEntityType
  initialSourceEntityId?: string
  deliverableType: DeliverableType
  deliverableTypeOptions: CreateDeliverableSelectOption[]
  selectedTemplate: DeliverableTemplateListItem | null
  title: string
  sourceEntityId: string
  includeAnswerContent: boolean
  includeArchivedDocuments: boolean
  includeEvidenceIndex: boolean
  sessionOptions: CreateDeliverableSelectOption[]
  requirementOptions: CreateDeliverableSelectOption[]
  preview: DeliverablePreviewResult | null
  templatesLoading: boolean
  sourcesLoading: boolean
  previewLoading: boolean
  creating: boolean
  selectedDocumentIds: string[]
  selectedDocumentTitles: string[]
  governanceBlockedReasons: string[]
  governanceDenied: boolean
  canCreateFromPreview: boolean
  governanceWarnings: string[]
  onDeliverableTypeChange: (type: DeliverableType) => void
  onTitleChange: (title: string) => void
  onSourceEntityIdChange: (id: string) => void
  onIncludeAnswerContentChange: (value: boolean) => void
  onIncludeArchivedDocumentsChange: (value: boolean) => void
  onIncludeEvidenceIndexChange: (value: boolean) => void
  onDocumentSelectionChange: (ids: string[], titles: string[]) => void
  onPreview: () => void
  onCreate: () => void
}

export interface BuildDeliverablePayloadInput {
  deliverableType: DeliverableType
  selectedTemplate: DeliverableTemplateListItem | null
  effectiveSource: DeliverableSourceEntityType
  projectId: string
  sourceEntityId: string
  initialSourceEntityId?: string
  title: string
  includeAnswerContent: boolean
  includeArchivedDocuments: boolean
  includeEvidenceIndex: boolean
  selectedDocumentIds: string[]
  entryContext: DeliverableEntryContext
}
