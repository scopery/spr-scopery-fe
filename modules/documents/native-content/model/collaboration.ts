export interface DocumentComment {
  id: string
  threadId: string
  body: string | null
  deleted?: boolean
  deletedAt?: string | null
  createdAt?: string
  createdBy?: string
}

export interface DocumentCommentThread {
  id: string
  documentId: string
  blockId?: string | null
  anchorText?: string | null
  status: 'OPEN' | 'RESOLVED' | 'ARCHIVED' | string
  resolvedBy?: string | null
  resolvedAt?: string | null
  comments?: DocumentComment[]
  createdAt?: string
}

export interface DocumentSuggestion {
  id: string
  documentId: string
  targetRevisionNo: number
  description?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | string
  acceptedBy?: string | null
  acceptedAt?: string | null
  acceptedRevisionNo?: number | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  createdAt?: string
}

export type EditorSidePanel =
  | 'attachments'
  | 'comments'
  | 'suggestions'
  | 'history'
  | 'subpages'
  | 'synced'
  | 'templates'
  | 'smart'
  | 'mentions'
  | 'visibility'
  | 'ai'
  | 'indexing'
