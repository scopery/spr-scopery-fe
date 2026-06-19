'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import type { LinkedDocumentForEntity } from '@/modules/documents/document-links'
import { toast } from 'sonner'
import * as evidenceApi from '../api/evidence-documents.api'
import type {
  EntityEvidenceDocumentsPanelProps,
  UseEntityEvidenceDocumentsPanelState,
} from '../model/evidence-documents'

export function useEntityEvidenceDocumentsPanel({
  orgId,
  projectId,
  linkedEntityType,
  linkedEntityId,
  sessionId,
  canView,
}: EntityEvidenceDocumentsPanelProps): UseEntityEvidenceDocumentsPanelState {
  const [items, setItems] = useState<LinkedDocumentForEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [showArchivedLinks, setShowArchivedLinks] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<LinkedDocumentForEntity | null>(null)
  const [restoreLinkTarget, setRestoreLinkTarget] = useState<LinkedDocumentForEntity | null>(null)
  const [restoreDocTarget, setRestoreDocTarget] = useState<LinkedDocumentForEntity | null>(null)
  const [removing, setRemoving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deliverableOpen, setDeliverableOpen] = useState(false)

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await evidenceApi.listLinkedEvidenceDocuments(orgId, {
        linked_entity_type: linkedEntityType,
        linked_entity_id: linkedEntityId,
        project_id: projectId,
        session_id: sessionId,
        include_archived_links: showArchivedLinks,
        document_status: showArchivedLinks ? undefined : 'active',
      })
      setItems(res.items)
    } catch {
      toast.error('Failed to load evidence documents')
    } finally {
      setLoading(false)
    }
  }, [canView, orgId, linkedEntityType, linkedEntityId, projectId, sessionId, showArchivedLinks])

  useEffect(() => {
    void load()
  }, [load])

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await evidenceApi.archiveEvidenceDocumentLink(
        orgId,
        removeTarget.document_id,
        removeTarget.id,
        projectId
      )
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

  const handleRestoreLink = async () => {
    if (!restoreLinkTarget) return
    setRestoring(true)
    try {
      await evidenceApi.restoreEvidenceDocumentLink(
        orgId,
        restoreLinkTarget.document_id,
        restoreLinkTarget.id,
        projectId
      )
      toast.success('Link restored')
      setRestoreLinkTarget(null)
      await load()
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to restore link'
      toast.error(msg)
    } finally {
      setRestoring(false)
    }
  }

  const handleRestoreDocument = async () => {
    if (!restoreDocTarget) return
    setRestoring(true)
    try {
      await evidenceApi.restoreEvidenceDocument(orgId, restoreDocTarget.document_id, projectId)
      toast.success('Document restored')
      setRestoreDocTarget(null)
      await load()
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to restore document'
      toast.error(msg)
    } finally {
      setRestoring(false)
    }
  }

  const handleExportEvidencePack = async () => {
    if (linkedEntityType !== 'requirement' && linkedEntityType !== 'session') return
    setExporting(true)
    try {
      await evidenceApi.exportEvidencePack(orgId, projectId, linkedEntityType, linkedEntityId)
      toast.success('Evidence pack exported')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export evidence pack'
      toast.error(msg)
    } finally {
      setExporting(false)
    }
  }

  return {
    items,
    loading,
    addOpen,
    bulkOpen,
    showArchivedLinks,
    removeTarget,
    restoreLinkTarget,
    restoreDocTarget,
    removing,
    restoring,
    exporting,
    deliverableOpen,
    setAddOpen,
    setBulkOpen,
    setShowArchivedLinks,
    setRemoveTarget,
    setRestoreLinkTarget,
    setRestoreDocTarget,
    setDeliverableOpen,
    load,
    handleRemove,
    handleRestoreLink,
    handleRestoreDocument,
    handleExportEvidencePack,
  }
}
