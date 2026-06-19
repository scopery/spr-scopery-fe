import {
  DOCUMENT_RELATION_LABELS,
  type DocumentLinkedEntityType,
  type DocumentRelationType,
  type LinkedDocumentForEntity,
} from '@/modules/documents/document-links'
import { getEvidenceDocumentTypeLabel } from '../lib/evidence-document-labels'
import { restoreDocument } from '@/modules/documents/document/api/documents.api'
import {
  exportRequirementEvidencePack,
  exportSessionEvidencePack,
} from '@/modules/documents/document-export/api/document-export.api'
import {
  archiveDocumentLink,
  bulkCreateDocumentLinks,
  createDocumentLink,
  listLinkedDocumentsForEntity,
  restoreDocumentLink,
} from '@/modules/documents/document-links/api/document-links.api'
import { listProjectDocumentsGrouped } from '@/modules/documents/project-sections/api/project-sections.api'
import type { EvidenceDocumentOption, EvidenceDocumentRow } from '../model/evidence-documents'

function flattenUniqueProjectDocuments(
  res: Awaited<ReturnType<typeof listProjectDocumentsGrouped>>
) {
  const items = [...res.pinned, ...res.unsectioned, ...res.sections.flatMap((s) => s.documents)]
  const seen = new Set<string>()
  return items.filter((d) => {
    if (seen.has(d.document_id)) return false
    seen.add(d.document_id)
    return true
  })
}

export async function listEvidenceDocumentOptions(
  orgId: string,
  projectId: string
): Promise<EvidenceDocumentOption[]> {
  const res = await listProjectDocumentsGrouped(orgId, projectId, { status: 'active' })
  return flattenUniqueProjectDocuments(res).map((d) => ({
    value: d.document_id,
    label: `${d.title} (${getEvidenceDocumentTypeLabel(d.document_type)})`,
  }))
}

export async function listEvidenceDocumentRows(
  orgId: string,
  projectId: string
): Promise<EvidenceDocumentRow[]> {
  const res = await listProjectDocumentsGrouped(orgId, projectId, { status: 'active' })
  return flattenUniqueProjectDocuments(res).map((d) => ({
    id: d.document_id,
    title: d.title,
    document_type: d.document_type,
  }))
}

export async function createEvidenceDocumentLink(
  orgId: string,
  documentId: string,
  body: {
    linked_entity_type: DocumentLinkedEntityType
    linked_entity_id: string
    relation_type: DocumentRelationType
    project_id: string
    session_id?: string
  }
) {
  return createDocumentLink(orgId, documentId, body)
}

export async function bulkCreateEvidenceDocumentLinks(
  orgId: string,
  body: {
    project_id: string
    linked_entity_type: DocumentLinkedEntityType
    linked_entity_id: string
    session_id?: string
    relation_type: DocumentRelationType
    document_ids: string[]
  }
) {
  return bulkCreateDocumentLinks(orgId, body)
}

export async function listLinkedEvidenceDocuments(
  orgId: string,
  params: {
    linked_entity_type: DocumentLinkedEntityType
    linked_entity_id: string
    project_id: string
    session_id?: string
    include_archived_links: boolean
    document_status?: 'active' | 'archived'
  }
): Promise<{ items: LinkedDocumentForEntity[] }> {
  return listLinkedDocumentsForEntity(orgId, params)
}

export async function archiveEvidenceDocumentLink(
  orgId: string,
  documentId: string,
  linkId: string,
  projectId: string
) {
  return archiveDocumentLink(orgId, documentId, linkId, projectId)
}

export async function restoreEvidenceDocumentLink(
  orgId: string,
  documentId: string,
  linkId: string,
  projectId: string
) {
  return restoreDocumentLink(orgId, documentId, linkId, projectId)
}

export async function restoreEvidenceDocument(
  orgId: string,
  documentId: string,
  projectId: string
) {
  return restoreDocument(orgId, documentId, projectId)
}

export async function exportEvidencePack(
  orgId: string,
  projectId: string,
  linkedEntityType: DocumentLinkedEntityType,
  linkedEntityId: string
) {
  if (linkedEntityType === 'requirement') {
    return exportRequirementEvidencePack(orgId, projectId, linkedEntityId, {
      package_format: 'zip',
    })
  }
  if (linkedEntityType === 'session') {
    return exportSessionEvidencePack(orgId, projectId, linkedEntityId, {
      package_format: 'zip',
    })
  }
}

export { getEvidenceDocumentTypeLabel } from '../lib/evidence-document-labels'
export { DOCUMENT_RELATION_LABELS }
