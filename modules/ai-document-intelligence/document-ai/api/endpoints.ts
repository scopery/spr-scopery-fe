import { v2 } from '@/shared/lib/api-paths'

export const AI_DOCUMENT_ENDPOINTS = {
  projectBrief: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/project-brief`),
  summarizeDocuments: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/summarize-documents`),
  qaSummary: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/qa-summary`),
  clarityReport: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/clarity-report`),
  readinessReport: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/readiness-report`),
  fromTemplate: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/from-template`),
  summarizeDocument: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/ai/summarize`),
  relatedDocuments: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; limit?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.limit != null) p.set('limit', String(params.limit))
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents/${documentId}/ai/related`) + (q ? `?${q}` : '')
  },
  documentMetadata: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/ai/metadata`),
  savePreview: (orgId: string) => v2(`/orgs/${orgId}/ai-documents/save-preview`),
} as const
