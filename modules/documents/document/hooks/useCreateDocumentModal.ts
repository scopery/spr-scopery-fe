'use client'

import { useEffect, useState } from 'react'
import type { DocumentType, DocumentVisibility } from '../model/document'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as createDocumentApi from '../api/create-document-modal.api'
import type { CreateDocumentModalProps } from '../model/create-document-modal'

export function useCreateDocumentModal({
  orgId,
  projectId,
  open,
  onSuccess,
}: CreateDocumentModalProps) {
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('note')
  const [visibility, setVisibility] = useState<DocumentVisibility>('project')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setTitle('')
      setDocumentType('note')
      setVisibility('project')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const doc = await createDocumentApi.createBlankProjectDocument(orgId, projectId, {
        title: title.trim(),
        document_type: documentType,
        visibility,
      })

      toast.success('Document created')
      onSuccess(doc.id)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to create document'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return {
    title,
    documentType,
    visibility,
    loading,
    setTitle,
    setDocumentType,
    setVisibility,
    handleSubmit,
  }
}
