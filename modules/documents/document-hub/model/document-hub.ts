import type { DocumentHubExportPreviewResult } from '@/modules/documents/document-export/api/document-export.api'
import type { DocumentHubItem } from '../api/document-hub.api'
import type { DocumentExportFormat, ExportPackageFormat } from '@/utils/exportDownload'

export type { DocumentHubExportPreviewResult, DocumentHubItem }

export type DocumentHubSelectionMode = 'page_selected' | 'filtered_all'

export interface DocumentHubExportOptions {
  format: DocumentExportFormat
  packageFormat: ExportPackageFormat
  includeEvidenceIndex: boolean
  includeArchived: boolean
}

export interface DocumentHubViewProps {
  orgId: string
  defaultProjectId?: string
  canCreateDocument?: boolean
  canCreateFromTemplate?: boolean
  canRestoreDocument?: boolean
  canExportDocuments?: boolean
}

export interface DocumentHubExportDialogProps {
  open: boolean
  onClose: () => void
  orgId: string
  selectionMode: DocumentHubSelectionMode
  selectedCount: number
  totalCount: number
  filters: Record<string, unknown>
  documentIds: string[]
  lifecycleStatus: 'active' | 'archived'
  loading?: boolean
  onExport: (options: DocumentHubExportOptions, previewUsed: boolean) => Promise<void>
}
