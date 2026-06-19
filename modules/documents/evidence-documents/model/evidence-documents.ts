import type {
  DocumentLinkedEntityType,
  DocumentRelationType,
  LinkedDocumentForEntity,
} from '@/modules/documents/document-links'
import type { DeliverableType } from '@/modules/documents/deliverables'

export interface EvidenceEntityProps {
  orgId: string
  projectId: string
  linkedEntityType: DocumentLinkedEntityType
  linkedEntityId: string
  sessionId?: string
}

export interface AddEvidenceDocumentDialogProps extends EvidenceEntityProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export interface BulkLinkEvidenceDocumentsDialogProps extends EvidenceEntityProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export interface EntityEvidenceDocumentsPanelProps extends EvidenceEntityProps {
  canView: boolean
  canCreateLink: boolean
  canRemoveLink: boolean
  canRestoreLink?: boolean
  canRestoreDocument?: boolean
  canExport?: boolean
  canCreateDeliverable?: boolean
  deliverableType?: DeliverableType
  enableBulkLink?: boolean
  title?: string
  emptyStateText?: string
  compact?: boolean
}

export interface AnswerEvidenceStripProps {
  orgId: string
  projectId: string
  sessionId: string
  questionId: string
  canView: boolean
  canCreateLink: boolean
  canRemoveLink: boolean
  canRestoreDocument?: boolean
}

export interface EvidenceDocumentOption {
  value: string
  label: string
}

export interface EvidenceDocumentRow {
  id: string
  title: string
  document_type: string
}

export interface UseAddEvidenceDocumentDialogState {
  relationType: DocumentRelationType
  documentId: string
  loading: boolean
  loadingDocs: boolean
  documentOptions: EvidenceDocumentOption[]
  setRelationType: (value: DocumentRelationType) => void
  setDocumentId: (value: string) => void
  handleSubmit: () => Promise<void>
}

export interface UseBulkLinkEvidenceDocumentsDialogState {
  relationType: DocumentRelationType
  selectedIds: Set<string>
  search: string
  loading: boolean
  loadingDocs: boolean
  filteredDocuments: EvidenceDocumentRow[]
  setRelationType: (value: DocumentRelationType) => void
  setSearch: (value: string) => void
  toggleDocument: (id: string) => void
  handleSubmit: () => Promise<void>
}

export interface UseEntityEvidenceDocumentsPanelState {
  items: LinkedDocumentForEntity[]
  loading: boolean
  addOpen: boolean
  bulkOpen: boolean
  showArchivedLinks: boolean
  removeTarget: LinkedDocumentForEntity | null
  restoreLinkTarget: LinkedDocumentForEntity | null
  restoreDocTarget: LinkedDocumentForEntity | null
  removing: boolean
  restoring: boolean
  exporting: boolean
  deliverableOpen: boolean
  setAddOpen: (value: boolean) => void
  setBulkOpen: (value: boolean) => void
  setShowArchivedLinks: (value: boolean | ((prev: boolean) => boolean)) => void
  setRemoveTarget: (value: LinkedDocumentForEntity | null) => void
  setRestoreLinkTarget: (value: LinkedDocumentForEntity | null) => void
  setRestoreDocTarget: (value: LinkedDocumentForEntity | null) => void
  setDeliverableOpen: (value: boolean) => void
  load: () => Promise<void>
  handleRemove: () => Promise<void>
  handleRestoreLink: () => Promise<void>
  handleRestoreDocument: () => Promise<void>
  handleExportEvidencePack: () => Promise<void>
}
