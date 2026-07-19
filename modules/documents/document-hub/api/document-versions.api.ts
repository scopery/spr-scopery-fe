/**
 * Document Hub — version / presigned upload helpers.
 */

import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { presignedFileTransfer } from '@/shared/lib/presignedFileTransfer'

export const DOCUMENT_VERSION_ENDPOINTS = {
  list: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/versions`),
  presignedUpload: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/versions/presigned-upload`),
  completeUpload: (projectId: string, documentId: string, versionId: string) =>
    apiPath(
      `/projects/${projectId}/documents/${documentId}/versions/${versionId}/complete-upload`),
  presignedDownload: (projectId: string, documentId: string, versionId: string) =>
    apiPath(
      `/projects/${projectId}/documents/${documentId}/versions/${versionId}/presigned-download`),
  generatedJobs: (projectId: string) =>
    apiPath(`/projects/${projectId}/generated-documents`),
} as const

export interface PresignedUploadResponse {
  versionId: string
  uploadUrl: string
  objectKey: string
  storageProvider?: string
  expiresAt?: string
}

export interface DocumentVersionItem {
  id: string
  documentId: string
  versionNumber: number
  fileName: string
  contentType?: string
  status: string
  uploadedAt?: string
}

export async function requestPresignedUpload(
  projectId: string,
  documentId: string,
  body: { fileName: string; contentType: string; changeNotes?: string }
): Promise<PresignedUploadResponse> {
  return apiClient.post(
    DOCUMENT_VERSION_ENDPOINTS.presignedUpload(projectId, documentId),
    body
  )
}

export async function completePresignedUpload(
  projectId: string,
  documentId: string,
  versionId: string
): Promise<void> {
  await apiClient.post(
    DOCUMENT_VERSION_ENDPOINTS.completeUpload(projectId, documentId, versionId),
    undefined,
    { parseJson: false }
  )
}

export async function listDocumentVersions(
  projectId: string,
  documentId: string
): Promise<{ items: DocumentVersionItem[] }> {
  const res = await apiClient.get<ListPayload<DocumentVersionItem>>(DOCUMENT_VERSION_ENDPOINTS.list(projectId, documentId))
  return normalizeItemList(res)
}

export async function listGeneratedDocumentJobs(
  projectId: string
): Promise<{ items: Array<{ id: string; status: string; templateId?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; status: string; templateId?: string }>>(DOCUMENT_VERSION_ENDPOINTS.generatedJobs(projectId))
  return normalizeItemList(res)
}

/**
 * Full DOC-03 flow: request URL → PUT file → complete upload.
 */
export async function uploadDocumentVersion(params: {
  projectId: string
  documentId: string
  file: File
  changeNotes?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<string> {
  const { projectId, documentId, file, changeNotes, onProgress, signal } = params
  const presigned = await requestPresignedUpload(projectId, documentId, {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    changeNotes,
  })
  await presignedFileTransfer.upload({
    uploadUrl: presigned.uploadUrl,
    file,
    contentType: file.type || 'application/octet-stream',
    onProgress,
    signal,
  })
  await completePresignedUpload(projectId, documentId, presigned.versionId)
  return presigned.versionId
}
