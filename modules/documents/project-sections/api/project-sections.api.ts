import { PROJECT_SECTION_ENDPOINTS } from './endpoints'
import { DOCUMENT_ENDPOINTS } from '../../document/api/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { GroupedProjectDocuments, ProjectSection } from '../model/project-section-types'
import type { DocumentType, DocumentWorkflowStatus } from '@/modules/documents/document'

export async function listProjectSections(
  orgId: string,
  projectId: string
): Promise<ProjectSection[]> {
  const res = await apiClient.get<{ items: ProjectSection[] }>(
    PROJECT_SECTION_ENDPOINTS.list(orgId, projectId)
  )
  return res.items
}

export async function createProjectSection(
  orgId: string,
  projectId: string,
  body: { title: string; description?: string | null }
): Promise<ProjectSection> {
  return apiClient.post<ProjectSection>(PROJECT_SECTION_ENDPOINTS.create(orgId, projectId), body)
}

export async function updateProjectSection(
  orgId: string,
  projectId: string,
  sectionId: string,
  body: { title?: string; description?: string | null }
): Promise<ProjectSection> {
  return apiClient.patch<ProjectSection>(
    PROJECT_SECTION_ENDPOINTS.update(orgId, projectId, sectionId),
    body
  )
}

export async function archiveProjectSection(
  orgId: string,
  projectId: string,
  sectionId: string
): Promise<ProjectSection> {
  return apiClient.post<ProjectSection>(
    PROJECT_SECTION_ENDPOINTS.archive(orgId, projectId, sectionId),
    {}
  )
}

export async function createDefaultProjectSections(
  orgId: string,
  projectId: string
): Promise<ProjectSection[]> {
  const res = await apiClient.post<{ items: ProjectSection[] }>(
    PROJECT_SECTION_ENDPOINTS.createDefaults(orgId, projectId),
    {}
  )
  return res.items
}

export async function reorderProjectSections(
  orgId: string,
  projectId: string,
  sectionIds: string[]
): Promise<ProjectSection[]> {
  const res = await apiClient.post<{ items: ProjectSection[] }>(
    PROJECT_SECTION_ENDPOINTS.reorder(orgId, projectId),
    { section_ids: sectionIds }
  )
  return res.items
}

export async function listProjectDocumentsGrouped(
  orgId: string,
  projectId: string,
  params?: {
    q?: string
    document_type?: DocumentType
    section_id?: string
    pinned_only?: boolean
    status?: 'active' | 'archived'
    workflow_status?: DocumentWorkflowStatus
  }
): Promise<GroupedProjectDocuments> {
  return apiClient.get<GroupedProjectDocuments>(
    DOCUMENT_ENDPOINTS.grouped(orgId, projectId, params)
  )
}

export async function moveDocumentToSection(
  orgId: string,
  projectId: string,
  documentId: string,
  sectionId: string | null
): Promise<{ section_id: string | null }> {
  return apiClient.patch<{ section_id: string | null }>(
    DOCUMENT_ENDPOINTS.moveToSection(orgId, projectId, documentId),
    { section_id: sectionId }
  )
}

export async function reorderDocumentsInSection(
  orgId: string,
  projectId: string,
  sectionId: string | null,
  documentIds: string[]
): Promise<{ reordered: number }> {
  return apiClient.post<{ reordered: number }>(
    DOCUMENT_ENDPOINTS.reorderInSection(orgId, projectId),
    { section_id: sectionId, document_ids: documentIds }
  )
}
