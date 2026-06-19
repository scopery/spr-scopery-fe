'use client'

import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import type { DocumentRelationType } from '@/modules/documents/document-links'
import { toast } from 'sonner'
import * as evidenceApi from '../api/evidence-documents.api'
import type {
  BulkLinkEvidenceDocumentsDialogProps,
  EvidenceDocumentRow,
  UseBulkLinkEvidenceDocumentsDialogState,
} from '../model/evidence-documents'

export function useBulkLinkEvidenceDocumentsDialog({
  orgId,
  projectId,
  linkedEntityType,
  linkedEntityId,
  sessionId,
  open,
  onSuccess,
}: BulkLinkEvidenceDocumentsDialogProps): UseBulkLinkEvidenceDocumentsDialogState {
  const [relationType, setRelationType] = useState<DocumentRelationType>('evidence_for')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [documents, setDocuments] = useState<EvidenceDocumentRow[]>([])

  useEffect(() => {
    if (!open) {
      setRelationType('evidence_for')
      setSelectedIds(new Set())
      setSearch('')
      setDocuments([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setLoadingDocs(true)
    void evidenceApi
      .listEvidenceDocumentRows(orgId, projectId)
      .then(setDocuments)
      .catch(() => {
        setDocuments([])
        toast.error('Failed to load project documents')
      })
      .finally(() => setLoadingDocs(false))
  }, [open, orgId, projectId])

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return documents
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        evidenceApi.getEvidenceDocumentTypeLabel(d.document_type).toLowerCase().includes(q)
    )
  }, [documents, search])

  const toggleDocument = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one document')
      return
    }

    setLoading(true)
    try {
      const result = await evidenceApi.bulkCreateEvidenceDocumentLinks(orgId, {
        project_id: projectId,
        linked_entity_type: linkedEntityType,
        linked_entity_id: linkedEntityId,
        relation_type: relationType,
        session_id: linkedEntityType === 'answer' ? sessionId : undefined,
        document_ids: [...selectedIds],
      })

      const parts: string[] = []
      if (result.created_count > 0) {
        parts.push(`${result.created_count} link${result.created_count === 1 ? '' : 's'} created`)
      }
      if (result.skipped_duplicate_count > 0) {
        parts.push(`${result.skipped_duplicate_count} skipped (already linked)`)
      }
      if (result.failed_count > 0) {
        parts.push(`${result.failed_count} failed`)
      }

      if (result.created_count > 0) {
        toast.success(parts.join(', ') || 'Links created')
        onSuccess()
      } else if (result.skipped_duplicate_count > 0) {
        toast.info(parts.join(', '))
        onSuccess()
      } else {
        toast.error('No links were created')
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to create links'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return {
    relationType,
    selectedIds,
    search,
    loading,
    loadingDocs,
    filteredDocuments,
    setRelationType,
    setSearch,
    toggleDocument,
    handleSubmit,
  }
}
