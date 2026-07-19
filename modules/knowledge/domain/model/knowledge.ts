import type { DocumentTypeStatus } from '../enums/knowledge.enum'

export interface DocumentType {
  id: string
  code: string
  name: string
  status: DocumentTypeStatus | string
  scope?: string | null
  description?: string | null
  createdAt?: string
}

export interface DocumentTypeListResponse {
  items: DocumentType[]
  page?: { limit: number; offset: number; total: number }
}
