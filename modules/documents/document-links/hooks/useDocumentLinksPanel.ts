'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import type { DocumentLink } from '../model/document-link-types'
import { toast } from 'sonner'
import * as documentLinksApi from '../api/document-links.api'
import type { DocumentLinksPanelProps } from '../model/document-links'

export function useDocumentLinksPanel({
  orgId,
  projectId,
  documentId,
  canView,
}: DocumentLinksPanelProps) {
  const [links, setLinks] = useState<DocumentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<DocumentLink | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<DocumentLink | null>(null)
  const [removing, setRemoving] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await documentLinksApi.listDocumentLinks(
        orgId,
        documentId,
        projectId,
        showArchived
      )
      setLinks(res.items)
    } catch {
      toast.error('Failed to load evidence links')
    } finally {
      setLoading(false)
    }
  }, [canView, orgId, documentId, projectId, showArchived])

  useEffect(() => {
    void load()
  }, [load])

  const handleAddSuccess = useCallback(() => {
    setAddOpen(false)
    void load()
  }, [load])

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await documentLinksApi.archiveDocumentLink(orgId, documentId, removeTarget.id, projectId)
      toast.success('Link removed')
      setRemoveTarget(null)
      await load()
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to remove link'
      toast.error(msg)
    } finally {
      setRemoving(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    setRestoring(true)
    try {
      await documentLinksApi.restoreDocumentLink(orgId, documentId, restoreTarget.id, projectId)
      toast.success('Link restored')
      setRestoreTarget(null)
      await load()
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to restore link'
      toast.error(msg)
    } finally {
      setRestoring(false)
    }
  }

  return {
    links,
    loading,
    showArchived,
    addOpen,
    removeTarget,
    restoreTarget,
    removing,
    restoring,
    setAddOpen,
    setRemoveTarget,
    setRestoreTarget,
    toggleArchived: () => setShowArchived((v) => !v),
    handleAddSuccess,
    handleRemove,
    handleRestore,
  }
}
