'use client'

import { useEffect, useState } from 'react'
import { Modal, Typography, Button, ContentLoader } from '@/shared/ui'
import * as documentsService from '@/services/documents.service'
import type { Document } from '@/types/document'
import { snippet } from '@/types/document'
import { DocumentTypeBadge } from './DocumentTypeBadge'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface AttachDocumentModalProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
  sectionId?: string | null
}

export function AttachDocumentModal({
  orgId,
  projectId,
  open,
  onClose,
  onSuccess,
  sectionId,
}: AttachDocumentModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [attaching, setAttaching] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    documentsService
      .listWorkspaceDocuments(orgId, { exclude_project_id: projectId, limit: 50 })
      .then((res) => setDocuments(res.items))
      .catch(() => toast.error('Failed to load workspace documents'))
      .finally(() => setLoading(false))
  }, [open, orgId, projectId])

  const handleAttach = async (documentId: string) => {
    setAttaching(documentId)
    try {
      await documentsService.attachDocumentToProject(orgId, projectId, documentId, sectionId ?? null)
      toast.success('Document attached')
      onSuccess()
      onClose()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to attach'
      toast.error(msg)
    } finally {
      setAttaching(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attach existing document"
      size="lg"
      actions={[{ label: 'Close', onClick: onClose, variant: 'ghost' }]}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <ContentLoader variant="easeOut" className="w-16" />
        </div>
      ) : documents.length === 0 ? (
        <Typography tone="muted" className="py-6 text-center">
          No available documents to attach.
        </Typography>
      ) : (
        <>
          <Typography variant="small" tone="muted" className="mb-3">
            Link a workspace document to this project. The original document is not copied.
          </Typography>
          <ul className="divide-y divide-neutral-200 max-h-80 overflow-y-auto">
          {documents.map((doc) => (
            <li key={doc.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Typography weight="medium">{doc.title}</Typography>
                <div className="mt-1">
                  <DocumentTypeBadge type={doc.document_type} />
                </div>
                {doc.plain_text && (
                  <Typography variant="small" tone="muted" className="mt-1 line-clamp-1">
                    {snippet(doc.plain_text)}
                  </Typography>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={attaching === doc.id}
                onClick={() => handleAttach(doc.id)}
              >
                Attach
              </Button>
            </li>
          ))}
        </ul>
        </>
      )}
    </Modal>
  )
}
