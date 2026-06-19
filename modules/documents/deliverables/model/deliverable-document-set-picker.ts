import type { DeliverablePickerItem } from '../model/document-deliverable-types'
import type { DeliverableSelectOption } from './deliverables'

export interface DeliverableDocumentSetPickerProps {
  orgId: string
  projectId: string
  selectedIds: string[]
  onSelectionChange: (ids: string[], titles: string[]) => void
  includeArchived: boolean
}

export interface DeliverableDocumentSetPickerViewProps {
  selectedIds: string[]
  search: string
  documentType: string
  documentTypeOptions: DeliverableSelectOption[]
  workflowStatus: string
  workflowStatusOptions: DeliverableSelectOption[]
  items: DeliverablePickerItem[]
  total: number
  loading: boolean
  loadingMore: boolean
  maxSelected: number
  hasMore: boolean
  onSearchChange: (value: string) => void
  onDocumentTypeChange: (value: string) => void
  onWorkflowStatusChange: (value: string) => void
  onToggleDocument: (item: DeliverablePickerItem) => void
  onClearSelection: () => void
  onLoadMore: () => void
}

export interface DocumentDeliverableMetadataPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  canRefresh?: boolean
}

export interface DocumentDeliverableMetadataPanelViewProps {
  loading: boolean
  metadata: import('../model/document-deliverable-types').DocumentDeliverableMetadata | null
  canRefresh: boolean
  refreshing: boolean
  showWarnings: boolean
  hasWarningDetails: boolean
  onToggleWarnings: () => void
  onRefresh: () => void
}

export interface DeliverableHistoryPanelProps {
  orgId: string
  projectId: string
  canExport?: boolean
}

export interface DeliverableHistoryPanelViewProps {
  items: import('../model/document-deliverable-types').DeliverableHistoryItem[]
  total: number
  loading: boolean
  loadingMore: boolean
  exportingId: string | null
  documentType: string
  documentTypeOptions: DeliverableSelectOption[]
  workflowStatus: string
  workflowStatusOptions: DeliverableSelectOption[]
  readinessStatus: string
  readinessOptions: DeliverableSelectOption[]
  includeArchived: boolean
  canExport: boolean
  orgId: string
  projectId: string
  onDocumentTypeChange: (value: string) => void
  onWorkflowStatusChange: (value: string) => void
  onReadinessStatusChange: (value: string) => void
  onIncludeArchivedChange: (value: boolean) => void
  onLoadMore: () => void
  onExport: (documentId: string) => void
}
