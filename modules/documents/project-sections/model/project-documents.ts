import type {
  DocumentType,
  DocumentWorkflowStatus,
  ProjectDocumentListItem,
} from '@/modules/documents/document'

export interface ProjectDocumentsFilters {
  q?: string
  document_type?: DocumentType | ''
  status?: 'active' | 'archived'
  workflow_status?: DocumentWorkflowStatus | ''
  section_id?: string
  pinned_only?: boolean
}

export type ProjectDocumentList = ProjectDocumentListItem[]

export interface ProjectSectionFormValues {
  title: string
  description: string | null
}
