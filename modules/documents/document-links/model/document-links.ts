import type {
  DocumentLink,
  DocumentLinkedEntityType,
  DocumentRelationType,
} from './document-link-types'

export interface AddDocumentLinkDialogProps {
  orgId: string
  projectId: string
  documentId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export interface DocumentLinksPanelProps {
  orgId: string
  projectId: string
  documentId: string
  canView: boolean
  canCreate: boolean
  canDelete: boolean
}

export interface TargetOption {
  value: string
  label: string
  sessionId?: string
}

export interface AddDocumentLinkDialogViewProps {
  open: boolean
  loading: boolean
  loadingTargets: boolean
  entityType: DocumentLinkedEntityType
  relationType: DocumentRelationType
  sessionId: string
  targetId: string
  sessionOptions: TargetOption[]
  targetOptions: TargetOption[]
  onClose: () => void
  onSubmit: () => void
  onEntityTypeChange: (value: DocumentLinkedEntityType) => void
  onRelationTypeChange: (value: DocumentRelationType) => void
  onSessionIdChange: (value: string) => void
  onTargetIdChange: (value: string) => void
}

export interface DocumentLinksPanelViewProps {
  orgId: string
  projectId: string
  documentId: string
  canCreate: boolean
  canDelete: boolean
  links: DocumentLink[]
  loading: boolean
  showArchived: boolean
  addOpen: boolean
  removeTarget: DocumentLink | null
  restoreTarget: DocumentLink | null
  removing: boolean
  restoring: boolean
  onToggleArchived: () => void
  onAddOpenChange: (open: boolean) => void
  onAddSuccess: () => void
  onRemoveTargetChange: (link: DocumentLink | null) => void
  onRestoreTargetChange: (link: DocumentLink | null) => void
  onRemove: () => void
  onRestore: () => void
}
