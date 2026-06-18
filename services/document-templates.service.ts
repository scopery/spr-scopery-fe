/**
 * Document templates service — v2 API
 */

import { DOCUMENT_ENDPOINTS, DOCUMENT_TEMPLATE_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  CreateDocumentFromTemplateInput,
  DocumentTemplate,
  DocumentTemplateWithVariableScan,
  PaginatedTemplatesResponse,
  TemplateStatus,
  TemplateVariableDefinition,
  TemplateVariablePreview,
} from '@/types/document-template'
import type { Document, DocumentType } from '@/types/document'

export async function listAvailableTemplates(
  orgId: string,
  params?: {
    q?: string
    document_type?: string
    scope?: string
    limit?: number
    offset?: number
  }
): Promise<PaginatedTemplatesResponse> {
  return apiClient.get<PaginatedTemplatesResponse>(DOCUMENT_TEMPLATE_ENDPOINTS.list(orgId, params))
}

export async function listManagementTemplates(
  orgId: string,
  params?: {
    q?: string
    document_type?: string
    scope?: string
    status?: TemplateStatus
    category?: string
    sort?: 'updated_at' | 'title'
    limit?: number
    offset?: number
  }
): Promise<PaginatedTemplatesResponse> {
  return apiClient.get<PaginatedTemplatesResponse>(
    DOCUMENT_TEMPLATE_ENDPOINTS.management(orgId, params)
  )
}

export async function getTemplate(
  orgId: string,
  templateId: string
): Promise<DocumentTemplateWithVariableScan> {
  return apiClient.get<DocumentTemplateWithVariableScan>(
    DOCUMENT_TEMPLATE_ENDPOINTS.get(orgId, templateId)
  )
}

export async function listTemplateVariables(orgId: string): Promise<TemplateVariableDefinition[]> {
  const res = await apiClient.get<{ items: TemplateVariableDefinition[] }>(
    DOCUMENT_TEMPLATE_ENDPOINTS.variables(orgId)
  )
  return res.items
}

export async function previewTemplateVariables(
  orgId: string,
  templateId: string,
  params?: {
    project_id?: string
    session_id?: string
    document_title?: string
    mode?: 'preview' | 'create_document'
  }
): Promise<TemplateVariablePreview> {
  return apiClient.get<TemplateVariablePreview>(
    DOCUMENT_TEMPLATE_ENDPOINTS.previewVariables(orgId, templateId, params)
  )
}

export async function createTemplate(
  orgId: string,
  body: {
    title: string
    description?: string | null
    scope: 'personal' | 'system'
    category?: string | null
    document_type?: DocumentType
    content?: { format: 'plate'; value: unknown[] }
    status?: 'draft' | 'published'
  }
): Promise<DocumentTemplate> {
  return apiClient.post<DocumentTemplate>(DOCUMENT_TEMPLATE_ENDPOINTS.create(orgId), body)
}

export async function updateTemplate(
  orgId: string,
  templateId: string,
  body: {
    title?: string
    description?: string | null
    category?: string | null
    document_type?: DocumentType
    content?: { format: 'plate'; value: unknown[] }
    status?: TemplateStatus
    is_published?: boolean
  }
): Promise<DocumentTemplate> {
  return apiClient.patch<DocumentTemplate>(
    DOCUMENT_TEMPLATE_ENDPOINTS.update(orgId, templateId),
    body
  )
}

export async function archiveTemplate(
  orgId: string,
  templateId: string
): Promise<DocumentTemplate> {
  return apiClient.post<DocumentTemplate>(
    DOCUMENT_TEMPLATE_ENDPOINTS.archive(orgId, templateId),
    {}
  )
}

export async function publishTemplate(
  orgId: string,
  templateId: string
): Promise<DocumentTemplate> {
  return apiClient.post<DocumentTemplate>(
    DOCUMENT_TEMPLATE_ENDPOINTS.publish(orgId, templateId),
    {}
  )
}

export async function unpublishTemplate(
  orgId: string,
  templateId: string
): Promise<DocumentTemplate> {
  return apiClient.post<DocumentTemplate>(
    DOCUMENT_TEMPLATE_ENDPOINTS.unpublish(orgId, templateId),
    {}
  )
}

export async function duplicateTemplate(
  orgId: string,
  templateId: string,
  body?: { title?: string }
): Promise<DocumentTemplate> {
  return apiClient.post<DocumentTemplate>(
    DOCUMENT_TEMPLATE_ENDPOINTS.duplicate(orgId, templateId),
    body ?? {}
  )
}

export async function createDocumentFromTemplateInProject(
  orgId: string,
  projectId: string,
  body: CreateDocumentFromTemplateInput
): Promise<Document> {
  return apiClient.post<Document>(DOCUMENT_ENDPOINTS.createFromTemplate(orgId, projectId), body)
}
