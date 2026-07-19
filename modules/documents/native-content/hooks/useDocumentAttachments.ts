'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as attachmentApi from '../api/document-attachment.api'
import type { DocumentAttachment } from '../model/document-attachment'

export function useDocumentAttachments(projectId: string, documentId: string) {
  const [items, setItems] = useState<DocumentAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !documentId) return
    setLoading(true)
    setError(null)
    try {
      const res = await attachmentApi.listDocumentAttachments(projectId, documentId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }, [projectId, documentId])

  useEffect(() => {
    void load()
  }, [load])

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      if (!list.length) return
      setUploading(true)
      setProgress(0)
      try {
        for (const file of list) {
          await attachmentApi.uploadDocumentAttachment({
            projectId,
            documentId,
            file,
            onProgress: setProgress,
          })
        }
        toast.success(list.length === 1 ? 'Attachment uploaded' : `${list.length} attachments uploaded`)
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setUploading(false)
        setProgress(0)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [projectId, documentId, load]
  )

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return {
    items,
    loading,
    error,
    uploading,
    progress,
    inputRef,
    refetch: load,
    uploadFiles,
    openFilePicker,
  }
}
