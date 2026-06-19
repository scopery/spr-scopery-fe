import type { DocumentType, DocumentVisibility } from '../model/document'
import type {
  DocumentTemplate,
  TemplateVariablePreview,
} from '@/modules/documents/document-templates'

export type CreateDocumentMode = 'blank' | 'template'

export interface CreateDocumentModalProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: (documentId: string) => void
  sectionId?: string | null
  canCreateFromTemplate?: boolean
}

export interface CreateDocumentModalViewProps extends CreateDocumentModalProps {
  mode: CreateDocumentMode
  title: string
  documentType: DocumentType
  visibility: DocumentVisibility
  selectedTemplate: DocumentTemplate | null
  loading: boolean
  variablePreview: TemplateVariablePreview | null
  previewLoading: boolean
  templateHasVariables: boolean
  onModeChange: (mode: CreateDocumentMode) => void
  onTitleChange: (title: string) => void
  onDocumentTypeChange: (documentType: DocumentType) => void
  onVisibilityChange: (visibility: DocumentVisibility) => void
  onTemplateSelect: (template: DocumentTemplate | null) => void
  onSubmit: (event: React.FormEvent) => void
}

export interface EmptyDocumentsStateProps {
  canCreate: boolean
  onCreate: () => void
}
