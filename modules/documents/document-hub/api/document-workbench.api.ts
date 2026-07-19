/**
 * Document Hub workbench API — project documents, folders, shares, templates, generated jobs.
 * Contract: `/api/projects/{projectId}/documents` (+ related).
 */

import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { downloadFromPresignedUrl } from '@/shared/lib/presignedFileTransfer'

export const DOCUMENT_WORKBENCH_ENDPOINTS = {
  documents: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/documents`),
    search: (projectId: string, q: string) =>
      apiPath(`/projects/${projectId}/documents/search?q=${encodeURIComponent(q)}`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/documents`),
    get: (projectId: string, documentId: string) =>
      apiPath(`/projects/${projectId}/documents/${documentId}`),
    getMasked: (projectId: string, documentId: string) =>
      apiPath(`/projects/${projectId}/documents/${documentId}/masked`),
    approve: (projectId: string, documentId: string) =>
      apiPath(`/projects/${projectId}/documents/${documentId}/approve`),
  },
  folders: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/document-folders`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/document-folders`),
    get: (projectId: string, folderId: string) =>
      apiPath(`/projects/${projectId}/document-folders/${folderId}`),
    archive: (projectId: string, folderId: string) =>
      apiPath(`/projects/${projectId}/document-folders/${folderId}/archive`),
  },
  shares: {
    list: (projectId: string, documentId: string) =>
      apiPath(`/projects/${projectId}/documents/${documentId}/shares`),
    create: (projectId: string, documentId: string) =>
      apiPath(`/projects/${projectId}/documents/${documentId}/shares`),
    revoke: (projectId: string, documentId: string, shareId: string) =>
      apiPath(`/projects/${projectId}/documents/${documentId}/shares/${shareId}/revoke`),
  },
  templates: {
    list: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/document-templates`),
    create: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/document-templates`),
    get: (workspaceId: string, templateId: string) =>
      apiPath(`/workspaces/${workspaceId}/document-templates/${templateId}`),
  },
  generated: {
    list: (projectId: string) => apiPath(`/projects/${projectId}/generated-documents`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/generated-documents`),
    get: (projectId: string, jobId: string) =>
      apiPath(`/projects/${projectId}/generated-documents/${jobId}`),
  },
  versions: {
    presignedDownload: (projectId: string, documentId: string, versionId: string) =>
      apiPath(
        `/projects/${projectId}/documents/${documentId}/versions/${versionId}/presigned-download`),
    get: (projectId: string, documentId: string, versionId: string) =>
      apiPath(`/projects/${projectId}/documents/${documentId}/versions/${versionId}`),
  },
} as const

export interface ProjectDocument {
  id: string
  projectId: string
  code?: string
  title: string
  status: string
  contentMode?: 'NATIVE' | 'FILE' | 'HYBRID' | string
  currentVersionId?: string
  createdAt?: string
  description?: string | null
  folderId?: string | null
}

export interface DocumentFolder {
  id: string
  projectId: string
  parentFolderId?: string | null
  name: string
  status: string
  sortOrder?: number
  createdAt?: string
}

export interface DocumentShare {
  id: string
  shareType: string
  granteeType?: string
  granteeId?: string
  expiresAt?: string | null
  status?: string
}

export interface DocumentTemplate {
  id: string
  code: string
  name: string
  description?: string | null
  category?: string | null
}

export async function listProjectDocuments(
  projectId: string
): Promise<{ items: ProjectDocument[] }> {
  const res = await apiClient.get<ListPayload<ProjectDocument>>(DOCUMENT_WORKBENCH_ENDPOINTS.documents.list(projectId))
  return normalizeItemList(res)
}

export async function searchProjectDocuments(
  projectId: string,
  q: string
): Promise<{ items: ProjectDocument[] }> {
  const res = await apiClient.get<ListPayload<ProjectDocument>>(DOCUMENT_WORKBENCH_ENDPOINTS.documents.search(projectId, q))
  return normalizeItemList(res)
}

export async function createProjectDocument(
  projectId: string,
  body: {
    title: string
    code?: string
    description?: string | null
    documentTypeCode?: string
    folderId?: string | null
    /** Wave 4.1 — NATIVE | FILE | HYBRID (default BE: FILE) */
    contentMode?: 'NATIVE' | 'FILE' | 'HYBRID'
  }
): Promise<ProjectDocument> {
  return apiClient.post(DOCUMENT_WORKBENCH_ENDPOINTS.documents.create(projectId), body)
}

export async function getProjectDocument(
  projectId: string,
  documentId: string
): Promise<ProjectDocument> {
  return apiClient.get(DOCUMENT_WORKBENCH_ENDPOINTS.documents.get(projectId, documentId))
}

export async function getProjectDocumentMasked(
  projectId: string,
  documentId: string
): Promise<ProjectDocument> {
  return apiClient.get(DOCUMENT_WORKBENCH_ENDPOINTS.documents.getMasked(projectId, documentId))
}

export async function approveProjectDocument(
  projectId: string,
  documentId: string
): Promise<ProjectDocument> {
  return apiClient.post(DOCUMENT_WORKBENCH_ENDPOINTS.documents.approve(projectId, documentId), {})
}

export async function listDocumentFolders(
  projectId: string
): Promise<{ items: DocumentFolder[] }> {
  const res = await apiClient.get<ListPayload<DocumentFolder>>(DOCUMENT_WORKBENCH_ENDPOINTS.folders.list(projectId))
  return normalizeItemList(res)
}

export async function createDocumentFolder(
  projectId: string,
  body: {
    parentFolderId?: string | null
    name: string
    description?: string | null
    sortOrder?: number
  }
): Promise<DocumentFolder> {
  return apiClient.post(DOCUMENT_WORKBENCH_ENDPOINTS.folders.create(projectId), body)
}

export async function archiveDocumentFolder(
  projectId: string,
  folderId: string
): Promise<void> {
  await apiClient.patch(
    DOCUMENT_WORKBENCH_ENDPOINTS.folders.archive(projectId, folderId),
    {},
    { parseJson: false }
  )
}

export async function listDocumentShares(
  projectId: string,
  documentId: string
): Promise<{ items: DocumentShare[] }> {
  const res = await apiClient.get<ListPayload<DocumentShare>>(DOCUMENT_WORKBENCH_ENDPOINTS.shares.list(projectId, documentId))
  return normalizeItemList(res)
}

export async function createDocumentShare(
  projectId: string,
  documentId: string,
  body: {
    shareType: 'LINK' | 'DIRECT_GRANT'
    granteeType?: string
    granteeId?: string
    expiresAt?: string | null
  }
): Promise<DocumentShare> {
  return apiClient.post(DOCUMENT_WORKBENCH_ENDPOINTS.shares.create(projectId, documentId), body)
}

export async function revokeDocumentShare(
  projectId: string,
  documentId: string,
  shareId: string
): Promise<void> {
  await apiClient.post(
    DOCUMENT_WORKBENCH_ENDPOINTS.shares.revoke(projectId, documentId, shareId),
    undefined,
    { parseJson: false }
  )
}

export async function listDocumentTemplates(
  workspaceId: string
): Promise<{ items: DocumentTemplate[] }> {
  const res = await apiClient.get<ListPayload<DocumentTemplate>>(DOCUMENT_WORKBENCH_ENDPOINTS.templates.list(workspaceId))
  return normalizeItemList(res)
}

export async function createDocumentTemplate(
  workspaceId: string,
  body: { code: string; name: string; description?: string | null; category?: string | null }
): Promise<DocumentTemplate> {
  return apiClient.post(DOCUMENT_WORKBENCH_ENDPOINTS.templates.create(workspaceId), body)
}

export async function queueGeneratedDocument(
  projectId: string,
  body: { templateId: string; jobType?: string }
): Promise<{ id: string; status: string }> {
  return apiClient.post(DOCUMENT_WORKBENCH_ENDPOINTS.generated.create(projectId), body)
}

export async function getGeneratedDocumentJob(
  projectId: string,
  jobId: string
): Promise<{ id: string; status: string; outputDocumentId?: string }> {
  return apiClient.get(DOCUMENT_WORKBENCH_ENDPOINTS.generated.get(projectId, jobId))
}

export async function processGeneratedDocumentJob(
  projectId: string,
  jobId: string,
  variables?: Record<string, unknown>
): Promise<{ id: string; status: string }> {
  return apiClient.post(
    apiPath(`/projects/${projectId}/generated-documents/${jobId}/process`),
    { variables: variables ?? {} }
  )
}

export async function completeGeneratedDocumentJob(
  projectId: string,
  jobId: string,
  outputDocumentId: string
): Promise<{ id: string; status: string }> {
  return apiClient.post(
    apiPath(`/projects/${projectId}/generated-documents/${jobId}/complete`),
    { outputDocumentId }
  )
}

export async function downloadDocumentVersion(
  projectId: string,
  documentId: string,
  versionId: string,
  fileName?: string
): Promise<void> {
  const res = await apiClient.post<{ downloadUrl: string }>(
    DOCUMENT_WORKBENCH_ENDPOINTS.versions.presignedDownload(projectId, documentId, versionId),
    {}
  )
  await downloadFromPresignedUrl({ downloadUrl: res.downloadUrl, fileName })
}
