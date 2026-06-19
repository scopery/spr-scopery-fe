export type {
  DocumentTemplate,
  DocumentTemplateWithVariableScan,
  TemplateStatus,
  TemplateScope,
  TemplateVariableDefinition,
  TemplateVariablePreview,
  CreateDocumentFromTemplateInput,
  PaginatedTemplatesResponse,
} from './document-template-types'

import type { TemplateStatus } from './document-template-types'

export interface DocumentTemplatesFilters {
  q?: string
  document_type?: string
  scope?: string
  status?: TemplateStatus
  category?: string
  sort?: 'updated_at' | 'title'
}
