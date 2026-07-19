'use client'

import { useCallback, useState } from 'react'
import {
  uploadDocumentVersion,
  listDocumentVersions,
  listGeneratedDocumentJobs,
  type DocumentVersionItem,
} from '../api/document-versions.api'
import { downloadDocumentVersion, queueGeneratedDocument } from '../api/document-workbench.api'

export function useDocumentVersionUpload(projectId: string | null, documentId: string | null) {
  const [versions, setVersions] = useState<DocumentVersionItem[]>([])
  const [jobs, setJobs] = useState<Array<{ id: string; status: string; templateId?: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshVersions = useCallback(async () => {
    if (!projectId || !documentId) return
    const res = await listDocumentVersions(projectId, documentId)
    setVersions(res.items)
  }, [projectId, documentId])

  const refreshJobs = useCallback(async () => {
    if (!projectId) return
    const res = await listGeneratedDocumentJobs(projectId)
    setJobs(res.items)
  }, [projectId])

  const upload = useCallback(
    async (file: File, changeNotes?: string) => {
      if (!projectId || !documentId) return null
      setUploading(true)
      setProgress(0)
      setError(null)
      try {
        const versionId = await uploadDocumentVersion({
          projectId,
          documentId,
          file,
          changeNotes,
          onProgress: setProgress,
        })
        await refreshVersions()
        return versionId
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        return null
      } finally {
        setUploading(false)
        setProgress(null)
      }
    },
    [projectId, documentId, refreshVersions]
  )

  const download = useCallback(
    async (versionId: string, fileName?: string) => {
      if (!projectId || !documentId) return
      setError(null)
      try {
        await downloadDocumentVersion(projectId, documentId, versionId, fileName)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed')
      }
    },
    [projectId, documentId]
  )

  const queueGeneration = useCallback(
    async (templateId: string) => {
      if (!projectId) return null
      setError(null)
      try {
        const job = await queueGeneratedDocument(projectId, { templateId })
        await refreshJobs()
        return job
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Queue failed')
        return null
      }
    },
    [projectId, refreshJobs]
  )

  return {
    versions,
    jobs,
    uploading,
    progress,
    error,
    upload,
    download,
    queueGeneration,
    refreshVersions,
    refreshJobs,
  }
}
