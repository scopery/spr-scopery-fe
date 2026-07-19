'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/document-workbench.api'
import type { DocumentFolder, DocumentShare, ProjectDocument } from '../api/document-workbench.api'

export function useDocumentFolders(projectId: string | null) {
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listDocumentFolders(projectId)
      setFolders(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (name: string, parentFolderId?: string | null) => {
      if (!projectId) return
      await api.createDocumentFolder(projectId, { name, parentFolderId: parentFolderId ?? null })
      await load()
    },
    [projectId, load]
  )

  const archive = useCallback(
    async (folderId: string) => {
      if (!projectId) return
      await api.archiveDocumentFolder(projectId, folderId)
      await load()
    },
    [projectId, load]
  )

  return { folders, loading, error, refetch: load, create, archive }
}

export function useDocumentInspector(projectId: string | null, documentId: string | null) {
  const [document, setDocument] = useState<ProjectDocument | null>(null)
  const [shares, setShares] = useState<DocumentShare[]>([])
  const [masked, setMasked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !documentId) return
    setLoading(true)
    setError(null)
    try {
      const [doc, shareRes] = await Promise.all([
        masked
          ? api.getProjectDocumentMasked(projectId, documentId)
          : api.getProjectDocument(projectId, documentId),
        api.listDocumentShares(projectId, documentId),
      ])
      setDocument(doc)
      setShares(shareRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }, [projectId, documentId, masked])

  useEffect(() => {
    void load()
  }, [load])

  const approve = useCallback(async () => {
    if (!projectId || !documentId) return
    setActionError(null)
    try {
      await api.approveProjectDocument(projectId, documentId)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approve failed')
    }
  }, [projectId, documentId, load])

  const createShare = useCallback(
    async (shareType: 'LINK' | 'DIRECT_GRANT') => {
      if (!projectId || !documentId) return
      setActionError(null)
      try {
        await api.createDocumentShare(projectId, documentId, { shareType })
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Share failed')
      }
    },
    [projectId, documentId, load]
  )

  const revokeShare = useCallback(
    async (shareId: string) => {
      if (!projectId || !documentId) return
      setActionError(null)
      try {
        await api.revokeDocumentShare(projectId, documentId, shareId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Revoke failed')
      }
    },
    [projectId, documentId, load]
  )

  return {
    document,
    shares,
    masked,
    setMasked,
    loading,
    error,
    actionError,
    refetch: load,
    approve,
    createShare,
    revokeShare,
  }
}

export function useProjectDocumentList(projectId: string | null) {
  const [items, setItems] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = query.trim()
        ? await api.searchProjectDocuments(projectId, query.trim())
        : await api.listProjectDocuments(projectId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [projectId, query])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (
      title: string,
      options?: { contentMode?: 'NATIVE' | 'FILE' | 'HYBRID' }
    ) => {
      if (!projectId) return null
      const created = await api.createProjectDocument(projectId, {
        title,
        contentMode: options?.contentMode ?? 'NATIVE',
      })
      await load()
      return created
    },
    [projectId, load]
  )

  return { items, loading, error, query, setQuery, refetch: load, create }
}
