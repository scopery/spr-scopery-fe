'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Typography, Button, Badge, ContentLoader } from '@/shared/ui'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import * as documentLinksService from '@/services/document-links.service'
import {
  DOCUMENT_LINKED_ENTITY_LABELS,
  DOCUMENT_RELATION_LABELS,
  type DocumentLink,
} from '@/types/document-link'
import { AddDocumentLinkDialog } from './AddDocumentLinkDialog'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface DocumentLinksPanelProps {
  orgId: string
  projectId: string
  documentId: string
  canView: boolean
  canCreate: boolean
  canDelete: boolean
}

export function DocumentLinksPanel({
  orgId,
  projectId,
  documentId,
  canView,
  canCreate,
  canDelete,
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
      const res = await documentLinksService.listDocumentLinks(
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

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await documentLinksService.archiveDocumentLink(orgId, documentId, removeTarget.id, projectId)
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
      await documentLinksService.restoreDocumentLink(orgId, documentId, restoreTarget.id, projectId)
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

  if (!canView) return null

  const activeLinks = links.filter((link) => !link.archived_at)
  const displayLinks = showArchived ? links : activeLinks

  return (
    <div className="border border-neutral-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 size={18} className="text-neutral-600" />
          <Typography weight="semibold">Evidence links</Typography>
          {!loading && activeLinks.length > 0 && (
            <Badge variant="soft" tone="neutral" size="sm">
              {activeLinks.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide archived' : 'Show archived'}
            </Button>
          )}
          {canCreate && (
            <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
              Add link
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <ContentLoader variant="easeOut" className="w-16" />
        </div>
      ) : displayLinks.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-200 px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            {showArchived ? 'No archived evidence links.' : 'No evidence links yet.'}
          </Typography>
        </div>
      ) : (
        <ul className="space-y-3">
          {displayLinks.map((link) => {
            const isArchived = link.archived_at != null
            return (
              <li key={link.id} className="border border-neutral-100 rounded p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <Badge variant="soft" tone="neutral" size="sm">
                        {DOCUMENT_LINKED_ENTITY_LABELS[link.linked_entity_type]}
                      </Badge>
                      <Badge variant="soft" tone="info" size="sm">
                        {DOCUMENT_RELATION_LABELS[link.relation_type]}
                      </Badge>
                      {isArchived && (
                        <Badge variant="soft" tone="warning" size="sm">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <Typography weight="medium" className="truncate">
                      {link.title_snapshot ?? link.linked_entity_id}
                    </Typography>
                    <Typography variant="small" tone="muted">
                      Linked {new Date(link.created_at).toLocaleString()}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canDelete && isArchived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<RotateCcw size={14} />}
                        aria-label="Restore link"
                        onClick={() => setRestoreTarget(link)}
                      />
                    )}
                    {canDelete && !isArchived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<Trash2 size={14} />}
                        aria-label="Remove link"
                        onClick={() => setRemoveTarget(link)}
                      />
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {canCreate && (
        <AddDocumentLinkDialog
          orgId={orgId}
          projectId={projectId}
          documentId={documentId}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setAddOpen(false)
            void load()
          }}
        />
      )}

      <ConfirmDialog
        open={removeTarget != null}
        onClose={() => setRemoveTarget(null)}
        title="Remove evidence link?"
        message="This removes the link between the document and the target entity. The document itself is not deleted."
        confirmLabel="Remove link"
        variant="danger"
        loading={removing}
        onConfirm={() => void handleRemove()}
      />

      <ConfirmDialog
        open={restoreTarget != null}
        onClose={() => setRestoreTarget(null)}
        title="Restore evidence link?"
        message="This reactivates the link between the document and the target entity."
        confirmLabel="Restore link"
        variant="default"
        loading={restoring}
        onConfirm={() => void handleRestore()}
      />
    </div>
  )
}
