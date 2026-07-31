'use client'

import { Eye, Link2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Typography, Button, Badge, Card, ConfirmDialog, Skeleton } from '@/shared/ui'
import {
  DOCUMENT_LINKED_ENTITY_LABELS,
  DOCUMENT_RELATION_LABELS,
} from '@/modules/documents/document-links'
import type { DocumentLinksPanelViewProps } from '../model/document-links'
import { AddDocumentLinkDialog } from './AddDocumentLinkDialog'

export function DocumentLinksPanelView({
  orgId,
  projectId,
  documentId,
  canCreate,
  canDelete,
  links,
  loading,
  showArchived,
  addOpen,
  removeTarget,
  restoreTarget,
  removing,
  restoring,
  onToggleArchived,
  onAddOpenChange,
  onAddSuccess,
  onRemoveTargetChange,
  onRestoreTargetChange,
  onRemove,
  onRestore,
}: DocumentLinksPanelViewProps) {
  const activeLinks = links.filter((link) => !link.archived_at)
  const displayLinks = showArchived ? links : activeLinks

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 size={18} className="text-neutral-600" />
          <Typography weight="semibold">Evidence links</Typography>
          {!loading && activeLinks.length > 0 && (
            <Badge variant="soft" tone="neutral">
              {activeLinks.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <Button variant="ghost" onClick={onToggleArchived} icon={<Eye size={16} />}>
              {showArchived ? 'Hide archived' : 'Show archived'}
            </Button>
          )}
          {canCreate && (
            <Button
              variant="outline"
              icon={<Plus size={14} />}
              onClick={() => onAddOpenChange(true)}
            >
              Add link
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Skeleton variant="rectangular" width="100%" height={80} />
        </div>
      ) : displayLinks.length === 0 ? (
        <Card className="border-dashed bg-transparent px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            {showArchived ? 'No archived evidence links.' : 'No evidence links yet.'}
          </Typography>
        </Card>
      ) : (
        <ul className="space-y-3">
          {displayLinks.map((link) => {
            const isArchived = link.archived_at != null
            return (
              <Card as="li" key={link.id} className="border-neutral-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap gap-2">
                      <Badge variant="soft" tone="neutral">
                        {DOCUMENT_LINKED_ENTITY_LABELS[link.linked_entity_type]}
                      </Badge>
                      <Badge variant="soft" tone="info">
                        {DOCUMENT_RELATION_LABELS[link.relation_type]}
                      </Badge>
                      {isArchived && (
                        <Badge variant="soft" tone="warning">
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
                  <div className="flex shrink-0 items-center gap-1">
                    {canDelete && isArchived && (
                      <Button
                        variant="ghost"
                        iconOnly
                        icon={<RotateCcw size={14} />}
                        aria-label="Restore link"
                        onClick={() => onRestoreTargetChange(link)}
                      />
                    )}
                    {canDelete && !isArchived && (
                      <Button
                        variant="ghost"
                        iconOnly
                        icon={<Trash2 size={14} />}
                        aria-label="Remove link"
                        onClick={() => onRemoveTargetChange(link)}
                      />
                    )}
                  </div>
                </div>
              </Card>
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
          onClose={() => onAddOpenChange(false)}
          onSuccess={onAddSuccess}
        />
      )}

      <ConfirmDialog
        open={removeTarget != null}
        onClose={() => onRemoveTargetChange(null)}
        title="Remove evidence link?"
        message="This removes the link between the document and the target entity. The document itself is not deleted."
        confirmLabel="Remove link"
        variant="danger"
        loading={removing}
        onConfirm={onRemove}
      />

      <ConfirmDialog
        open={restoreTarget != null}
        onClose={() => onRestoreTargetChange(null)}
        title="Restore evidence link?"
        message="This reactivates the link between the document and the target entity."
        confirmLabel="Restore link"
        variant="default"
        loading={restoring}
        onConfirm={onRestore}
      />
    </Card>
  )
}
