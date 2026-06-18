'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Select, Typography } from '@/shared/ui'
import * as documentLinksService from '@/services/document-links.service'
import * as projectSectionsService from '@/services/project-sections.service'
import {
  DOCUMENT_RELATION_OPTIONS,
  type DocumentLinkedEntityType,
  type DocumentRelationType,
} from '@/types/document-link'
import { DOCUMENT_TYPE_LABEL, type DocumentType } from '@/types/document'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface AddEvidenceDocumentDialogProps {
  orgId: string
  projectId: string
  linkedEntityType: DocumentLinkedEntityType
  linkedEntityId: string
  sessionId?: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type DocumentOption = { value: string; label: string }

export function AddEvidenceDocumentDialog({
  orgId,
  projectId,
  linkedEntityType,
  linkedEntityId,
  sessionId,
  open,
  onClose,
  onSuccess,
}: AddEvidenceDocumentDialogProps) {
  const [relationType, setRelationType] = useState<DocumentRelationType>('evidence_for')
  const [documentId, setDocumentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [documents, setDocuments] = useState<DocumentOption[]>([])

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
    void projectSectionsService
      .listProjectDocumentsGrouped(orgId, projectId, { status: 'active' })
      .then((res) => {
        const items = [
          ...res.pinned,
          ...res.unsectioned,
          ...res.sections.flatMap((s) => s.documents),
        ]
        const seen = new Set<string>()
        const unique = items.filter((d) => {
          if (seen.has(d.document_id)) return false
          seen.add(d.document_id)
          return true
        })
        setDocuments(
          unique.map((d) => ({
            value: d.document_id,
            label: `${d.title} (${DOCUMENT_TYPE_LABEL[d.document_type as DocumentType] ?? d.document_type})`,
          }))
        )
      })
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
      await documentLinksService.createDocumentLink(orgId, documentId, {
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Link evidence document"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Link document', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Attach an existing project document as evidence for this {linkedEntityType.replace('_', ' ')}.
        </Typography>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Relation
          </Typography>
          <Select
            value={relationType}
            onValueChange={(v: string) => setRelationType(v as DocumentRelationType)}
            options={DOCUMENT_RELATION_OPTIONS}
          />
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Document
          </Typography>
          <Select
            value={documentId}
            onValueChange={setDocumentId}
            options={documentOptions}
            placeholder={loadingDocs ? 'Loading documents…' : 'Select document'}
          />
        </div>
      </div>
    </Modal>
  )
}
