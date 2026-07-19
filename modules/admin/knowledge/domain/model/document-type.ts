import type { DocumentScope, DocumentTypeStatus } from '../enums/knowledge.enum'

export interface DocumentType {
  id: string
  code: string
  name: string
  description: string | null
  documentScope: DocumentScope
  workspaceId: string | null
  status: DocumentTypeStatus
  deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSystemDocumentTypePayload {
  code: string
  name: string
  description?: string
}

export interface CreateWorkspaceDocumentTypePayload {
  code: string
  name: string
  description?: string
  workspaceId: string
}

export interface UpdateDocumentTypePayload {
  name: string
  description?: string
}

export interface SearchDocumentTypesParams {
  keyword?: string
  workspaceId?: string
  documentScope?: DocumentScope
  status?: DocumentTypeStatus
  includeDeleted?: boolean
  page?: number
  size?: number
}
