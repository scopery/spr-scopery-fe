import { apiPath } from '@/shared/lib/api-paths'

/**
 * AI Document Intelligence
 * Description: AI-powered document generation and analysis: generate project briefs,
 *              summarize documents, produce QA/clarity/readiness reports, find related documents,
 *              extract metadata, and save AI-generated document previews.
 */
export const AI_DOCUMENT_ENDPOINTS = {
  /* --- Project-level AI documents --- */
  projectBrief: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/generated-documents/project-brief`),
  summarizeDocuments: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/generated-documents/summarize-documents`),
  qaSummary: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/generated-documents/qa-summary`),
  clarityReport: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/generated-documents/clarity-report`),
  readinessReport: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/generated-documents/readiness-report`),
  fromTemplate: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/generated-documents/from-template`),

  /* --- Document-level AI --- */
  summarizeDocument: (orgId: string, documentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/ai/summarize`),
  relatedDocuments: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; limit?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.limit != null) p.set('limit', String(params.limit))
    const q = p.toString()
    return apiPath(`/workspaces/${orgId}/documents/${documentId}/ai/related`) + (q ? `?${q}` : '')
  },
  documentMetadata: (orgId: string, documentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/ai/metadata`),

  /* --- Save --- */
  savePreview: (orgId: string) => apiPath(`/workspaces/${orgId}/generated-documents/save-preview`),
} as const
