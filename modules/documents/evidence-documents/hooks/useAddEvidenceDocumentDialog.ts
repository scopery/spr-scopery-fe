'use client'

import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import type { DocumentRelationType } from '@/modules/documents/document-links'
import { toast } from 'sonner'
import * as evidenceApi from '../api/evidence-documents.api'
import type {
  AddEvidenceDocumentDialogProps,
  EvidenceDocumentOption,
  UseAddEvidenceDocumentDialogState,
} from '../model/evidence-documents'

export function useAddEvidenceDocumentDialog({
  orgId,
  projectId,
  linkedEntityType,
  linkedEntityId,
  sessionId,
  open,
  onSuccess,
}: AddEvidenceDocumentDialogProps): UseAddEvidenceDocumentDialogState {
  const [relationType, setRelationType] = useState<DocumentRelationType>('evidence_for')
  const [documentId, setDocumentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [documents, setDocuments] = useState<EvidenceDocumentOption[]>([])

  useEffect(() => {
    if (!open) {
      setRelationType('evidence_for')
      setDocumentId('')
      setDocuments([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setLoadingDocs(true)
    void evidenceApi
      .listEvidenceDocumentOptions(orgId, projectId)
      .then(setDocuments)
      .catch(() => {
        setDocuments([])
        toast.error('Failed to load project documents')
      })
      .finally(() => setLoadingDocs(false))
  }, [open, orgId, projectId])

  const documentOptions = useMemo(
    () => documents.map((d) => ({ value: d.value, label: d.label })),
    [documents]
  )

  const handleSubmit = async () => {
    if (!documentId) {
      toast.error('Select a document')
      return
    }

    setLoading(true)
    try {
      await evidenceApi.createEvidenceDocumentLink(orgId, documentId, {
        linked_entity_type: linkedEntityType,
        linked_entity_id: linkedEntityId,
        relation_type: relationType,
        project_id: projectId,
        session_id: linkedEntityType === 'answer' ? sessionId : undefined,
      })
      toast.success('Evidence link created')
      onSuccess()
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to create link'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return {
    relationType,
    documentId,
    loading,
    loadingDocs,
    documentOptions,
    setRelationType,
    setDocumentId,
    handleSubmit,
  }
}
