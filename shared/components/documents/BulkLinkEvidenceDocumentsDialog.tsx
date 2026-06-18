'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Select, Typography, Input } from '@/shared/ui'
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

interface BulkLinkEvidenceDocumentsDialogProps {
  orgId: string
  projectId: string
  linkedEntityType: DocumentLinkedEntityType
  linkedEntityId: string
  sessionId?: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type DocumentRow = { id: string; title: string; document_type: string }

export function BulkLinkEvidenceDocumentsDialog({
  orgId,
  projectId,
  linkedEntityType,
  linkedEntityId,
  sessionId,
  open,
  onClose,
  onSuccess,
}: BulkLinkEvidenceDocumentsDialogProps) {
  const [relationType, setRelationType] = useState<DocumentRelationType>('evidence_for')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [documents, setDocuments] = useState<DocumentRow[]>([])

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
            id: d.document_id,
            title: d.title,
            document_type: d.document_type,
          }))
        )
      })
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
        (DOCUMENT_TYPE_LABEL[d.document_type as DocumentType] ?? d.document_type)
          .toLowerCase()
          .includes(q)
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
      const result = await documentLinksService.bulkCreateDocumentLinks(orgId, {
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Link multiple documents"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: selectedIds.size > 0 ? `Link ${selectedIds.size} document${selectedIds.size === 1 ? '' : 's'}` : 'Link documents',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: selectedIds.size === 0,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Select existing project documents to link as evidence for this {linkedEntityType.replace('_', ' ')}.
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
            Search documents
          </Typography>
          <Input
            placeholder={loadingDocs ? 'Loading documents…' : 'Search by title or type…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </div>

        <div className="max-h-64 overflow-y-auto border border-neutral-200 rounded">
          {loadingDocs ? (
            <Typography variant="small" tone="muted" className="p-4 text-center">
              Loading documents…
            </Typography>
          ) : filteredDocuments.length === 0 ? (
            <Typography variant="small" tone="muted" className="p-4 text-center">
              No active documents found in this project.
            </Typography>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {filteredDocuments.map((doc) => {
                const checked = selectedIds.has(doc.id)
                const typeLabel =
                  DOCUMENT_TYPE_LABEL[doc.document_type as DocumentType] ?? doc.document_type
                return (
                  <li key={doc.id}>
                    <label className="flex items-start gap-3 p-3 cursor-pointer hover:bg-neutral-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDocument(doc.id)}
                        className="mt-1"
                      />
                      <span className="min-w-0">
                        <Typography weight="medium" className="truncate block">
                          {doc.title}
                        </Typography>
                        <Typography variant="small" tone="muted">
                          {typeLabel}
                        </Typography>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {selectedIds.size > 0 && (
          <Typography variant="small" tone="muted">
            {selectedIds.size} document{selectedIds.size === 1 ? '' : 's'} selected
          </Typography>
        )}
      </div>
    </Modal>
  )
}
