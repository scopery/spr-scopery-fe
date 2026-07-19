import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList } from '@/shared/lib/normalizeListResponse'
import { uploadToPresignedUrl } from '@/shared/lib/presignedFileTransfer'
import { DOCUMENT_ATTACHMENT_ENDPOINTS } from './endpoints'
import type { CreateAttachmentBody, DocumentAttachment } from '../model/document-attachment'

export async function listDocumentAttachments(
  projectId: string,
  documentId: string
): Promise<{ items: DocumentAttachment[] }> {
  const res = await apiClient.get<DocumentAttachment[]>(
    DOCUMENT_ATTACHMENT_ENDPOINTS.list(projectId, documentId)
  )
  return normalizeItemList(res)
}

export async function createAttachmentPresignedUpload(
  projectId: string,
  documentId: string,
  body: CreateAttachmentBody
): Promise<DocumentAttachment> {
  return apiClient.post<DocumentAttachment>(
    DOCUMENT_ATTACHMENT_ENDPOINTS.create(projectId, documentId),
    body
  )
}

export async function completeAttachmentUpload(
  projectId: string,
  documentId: string,
  attachmentId: string
): Promise<DocumentAttachment> {
  return apiClient.post<DocumentAttachment>(
    DOCUMENT_ATTACHMENT_ENDPOINTS.completeUpload(projectId, documentId, attachmentId),
    {}
  )
}

/**
 * Full flow: create → PUT file to presigned URL → complete-upload.
 */
export async function uploadDocumentAttachment(params: {
  projectId: string
  documentId: string
  file: File
  blockId?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<DocumentAttachment> {
  const { projectId, documentId, file, blockId, onProgress, signal } = params
  const created = await createAttachmentPresignedUpload(projectId, documentId, {
    fileName: file.name,
    mediaType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size,
    blockId,
  })

  if (!created.presignedUrl) {
    throw new Error('Attachment create did not return a presigned upload URL')
  }

  await uploadToPresignedUrl({
    uploadUrl: created.presignedUrl,
    file,
    contentType: file.type || 'application/octet-stream',
    onProgress,
    signal,
  })

  return completeAttachmentUpload(projectId, documentId, created.id)
}
