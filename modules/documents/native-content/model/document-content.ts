/** Revision type for PUT /content and revision metadata. */
export const ContentRevisionType = {
  AutosaveCheckpoint: 'AUTOSAVE_CHECKPOINT',
  Manual: 'MANUAL',
  Restore: 'RESTORE',
  AiAccept: 'AI_ACCEPT',
  TemplateCreate: 'TEMPLATE_CREATE',
} as const
export type ContentRevisionType =
  (typeof ContentRevisionType)[keyof typeof ContentRevisionType]

export const DocumentContentMode = {
  Native: 'NATIVE',
  File: 'FILE',
  Hybrid: 'HYBRID',
} as const
export type DocumentContentMode =
  (typeof DocumentContentMode)[keyof typeof DocumentContentMode]

export interface DocumentContentResponse {
  id: string
  documentId: string
  revisionNo: number
  ast: string
  plainText?: string
  wordCount?: number
  characterCount?: number
  checksum?: string
  schemaVersion?: number
  lastSavedAt?: string
  lastSavedBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface SaveDocumentContentRequest {
  ast: string
  expectedBaseRevisionNo: number
  schemaVersion?: number
  revisionType?: ContentRevisionType
}

export interface DocumentRevisionListItem {
  id: string
  documentId: string
  revisionNo: number
  revisionType: string
  checksum?: string
  wordCount?: number
  characterCount?: number
  schemaVersion?: number
  createdAt?: string
  createdBy?: string
}

export interface DocumentRevisionDetail extends DocumentRevisionListItem {
  ast: string
}

export type NativeEditorSaveStatus =
  | 'idle'
  | 'unsaved'
  | 'saving'
  | 'saved'
  | 'conflict'
  | 'error'

export const CONTENT_OPTIMISTIC_LOCK_CONFLICT = 'CONTENT_OPTIMISTIC_LOCK_CONFLICT'
export const DOCUMENT_NATIVE_CONTENT_NOT_SUPPORTED = 'DOCUMENT_NATIVE_CONTENT_NOT_SUPPORTED'
