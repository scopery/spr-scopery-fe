export type AttachmentStorageStatus =
  | 'PENDING_UPLOAD'
  | 'AVAILABLE'
  | 'FAILED'
  | 'PURGED'
  | string

export interface DocumentAttachment {
  id: string
  documentId: string
  blockId?: string | null
  fileName: string
  mediaType?: string | null
  fileSizeBytes?: number | null
  storageStatus: AttachmentStorageStatus
  /** Present only on create-presigned response */
  presignedUrl?: string | null
  presignedExpiresAt?: string | null
  createdAt?: string
}

export interface CreateAttachmentBody {
  fileName: string
  mediaType?: string
  fileSizeBytes?: number
  blockId?: string
}
