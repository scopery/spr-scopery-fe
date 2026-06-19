'use client'

import { useCallback, useEffect, useState } from 'react'
import * as attachDocumentModalApi from '../api/attach-document-modal.api'
import { toAttachDocumentListItems } from '../api/attach-document-modal.mapper'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import type { AttachDocumentListItem } from '../model/attach-document-modal'

interface UseAttachDocumentModalParams {
  orgId: string
  projectId: string
  open: boolean
  sectionId?: string | null
  onSuccess: () => void
  onClose: () => void
}

export function useAttachDocumentModal({
  orgId,
  projectId,
  open,
  sectionId,
  onSuccess,
  onClose,
}: UseAttachDocumentModalParams) {
  const [documents, setDocuments] = useState<AttachDocumentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [attachingId, setAttachingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    attachDocumentModalApi
      .listWorkspaceDocuments(orgId, projectId)
      .then((items) => setDocuments(toAttachDocumentListItems(items)))
      .catch(() => toast.error('Failed to load workspace documents'))
      .finally(() => setLoading(false))
  }, [open, orgId, projectId])

  const attach = useCallback(
    async (documentId: string) => {
      setAttachingId(documentId)
      try {
        await attachDocumentModalApi.attachDocumentToProject(
          orgId,
          projectId,
          documentId,
          sectionId ?? null
        )
        toast.success('Document attached')
        onSuccess()
        onClose()
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.problem.detail
            : err instanceof Error
              ? err.message
              : 'Failed to attach'
        toast.error(msg)
      } finally {
        setAttachingId(null)
      }
    },
    [orgId, projectId, sectionId, onSuccess, onClose]
  )

  return { documents, loading, attachingId, attach }
}
