'use client'

import Link from 'next/link'
import { ExternalLink, Eye, FileText, Link2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Typography, Button, Badge, Card, ConfirmDialog, Skeleton } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { DOCUMENT_RELATION_LABELS } from '@/modules/documents/document-links'
import type { DocumentType } from '@/modules/documents/document'
import type { EntityEvidenceDocumentsPanelProps } from '../model/evidence-documents'
import { useEntityEvidenceDocumentsPanel } from '../hooks/useEntityEvidenceDocumentsPanel'
import { AddEvidenceDocumentDialog } from './AddEvidenceDocumentDialog'
import { DocumentTypeBadge } from '@/modules/documents/document/ui/DocumentTypeBadge'
import { WorkflowStatusBadge } from '@/modules/documents/document/ui/WorkflowStatusBadge'

export function EntityEvidenceDocumentsPanel(props: EntityEvidenceDocumentsPanelProps) {
  const {
    orgId,
    projectId,
    linkedEntityType,
    linkedEntityId,
    sessionId,
    canView,
    canCreateLink,
    canRemoveLink,
    canRestoreLink,
    canRestoreDocument = false,
    title = 'Evidence documents',
    emptyStateText = 'No evidence documents linked yet.',
    linkButtonLabel = 'Link document',
    compact = false,
  } = props
  const panel = useEntityEvidenceDocumentsPanel(props)
  const canRestore = canRestoreLink ?? canRemoveLink

  if (!canView) return null

  const documentHref = (documentId: string) =>
    `${ROUTES.workspace.document(orgId, documentId)}?projectId=${encodeURIComponent(projectId)}`

  const activeItems = panel.items.filter(
    (item) => !item.archived_at && item.document_status !== 'archived'
  )
  const displayItems = panel.showArchivedLinks ? panel.items : activeItems

  return (
    <div
      className={
        compact ? 'space-y-3' : 'space-y-4 border border-dashed border-neutral-300 bg-white p-4'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link2 size={compact ? 16 : 18} className="shrink-0 text-neutral-600" />
          <Typography weight="semibold" size="sm" className="truncate" title={title}>
            {title}
          </Typography>
          {!panel.loading && activeItems.length > 0 && (
            <Badge variant="soft" tone="neutral">
              {activeItems.length}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canRestore && (
            <Button
              variant="ghost"
              onClick={() => panel.setShowArchivedLinks((v) => !v)}
              icon={<Eye size={16} />}
            >
              {panel.showArchivedLinks ? 'Hide archived' : 'Show archived'}
            </Button>
          )}
          {canCreateLink && (
            <Button
              variant="outline"
              icon={<Plus size={14} />}
              onClick={() => panel.setAddOpen(true)}
            >
              {linkButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {panel.loading ? (
        <div className="flex justify-center py-4">
          <Skeleton variant="rectangular" width="100%" height={80} />
        </div>
      ) : displayItems.length === 0 ? (
        <Card
          hasShadow={false}
          className="border-dashed border-neutral-300 bg-transparent px-4 py-6 text-center"
        >
          <Typography variant="small" tone="muted">
            {panel.showArchivedLinks
              ? 'No archived evidence links for this entity.'
              : emptyStateText}
          </Typography>
        </Card>
      ) : (
        <ul className="space-y-2">
          {displayItems.map((item) => {
            const docType = item.document_type as DocumentType
            const workflowStatus = item.workflow_status as 'draft' | 'in_review' | 'approved'
            const isArchivedLink = item.archived_at != null
            const isArchivedDoc = item.document_status === 'archived'
            return (
              <Card
                as="li"
                key={item.id}
                hasShadow={false}
                className={
                  compact
                    ? 'border-neutral-300 bg-transparent p-2'
                    : 'border-neutral-300 bg-transparent p-3'
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <FileText size={14} className="shrink-0 text-neutral-500" />
                      <Typography
                        size="sm"
                        weight="medium"
                        className="truncate"
                        title={item.document_title}
                      >
                        {item.document_title}
                      </Typography>
                    </div>
                    <div className="mb-1 flex flex-wrap gap-2">
                      <DocumentTypeBadge type={docType} />
                      {workflowStatus && <WorkflowStatusBadge status={workflowStatus} />}
                      <Badge variant="soft" tone="info">
                        {DOCUMENT_RELATION_LABELS[item.relation_type]}
                      </Badge>
                      {isArchivedLink && (
                        <Badge variant="soft" tone="warning">
                          Link archived
                        </Badge>
                      )}
                      {isArchivedDoc && (
                        <Badge variant="soft" tone="warning">
                          Document archived
                        </Badge>
                      )}
                    </div>
                    <Typography variant="small" tone="muted">
                      Updated {new Date(item.updated_at).toLocaleDateString()}
                    </Typography>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!isArchivedDoc && (
                      <Button
                        as={Link}
                        href={documentHref(item.document_id)}
                        variant="ghost"
                        iconOnly
                        icon={<ExternalLink size={14} />}
                        aria-label="Open document"
                      />
                    )}
                    {canRestore && isArchivedLink && !isArchivedDoc && (
                      <Button
                        variant="ghost"
                        iconOnly
                        icon={<RotateCcw size={14} />}
                        aria-label="Restore link"
                        onClick={() => panel.setRestoreLinkTarget(item)}
                      />
                    )}
                    {canRestoreDocument && isArchivedDoc && (
                      <Button
                        variant="ghost"
                        iconOnly
                        icon={<RotateCcw size={14} />}
                        aria-label="Restore document"
                        onClick={() => panel.setRestoreDocTarget(item)}
                      />
                    )}
                    {canRemoveLink && !isArchivedLink && (
                      <Button
                        variant="ghost"
                        iconOnly
                        icon={<Trash2 size={14} />}
                        aria-label="Remove link"
                        onClick={() => panel.setRemoveTarget(item)}
                      />
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </ul>
      )}

      {canCreateLink ? (
        <AddEvidenceDocumentDialog
          orgId={orgId}
          projectId={projectId}
          linkedEntityType={linkedEntityType}
          linkedEntityId={linkedEntityId}
          sessionId={sessionId}
          open={panel.addOpen}
          onClose={() => panel.setAddOpen(false)}
          onSuccess={() => {
            panel.setAddOpen(false)
            void panel.load()
            props.onLinksChanged?.()
          }}
        />
      ) : null}

      <ConfirmDialog
        open={panel.removeTarget != null}
        onClose={() => panel.setRemoveTarget(null)}
        title="Remove evidence link?"
        message="This removes the link between the document and this entity. The document itself is not deleted."
        confirmLabel="Remove link"
        variant="danger"
        loading={panel.removing}
        onConfirm={() => void panel.handleRemove()}
      />

      <ConfirmDialog
        open={panel.restoreLinkTarget != null}
        onClose={() => panel.setRestoreLinkTarget(null)}
        title="Restore evidence link?"
        message="This reactivates the link between the document and this entity."
        confirmLabel="Restore link"
        variant="default"
        loading={panel.restoring}
        onConfirm={() => void panel.handleRestoreLink()}
      />

      <ConfirmDialog
        open={panel.restoreDocTarget != null}
        onClose={() => panel.setRestoreDocTarget(null)}
        title="Restore document?"
        message="This restores the archived document. Active evidence links will become visible again."
        confirmLabel="Restore document"
        variant="default"
        loading={panel.restoring}
        onConfirm={() => void panel.handleRestoreDocument()}
      />
    </div>
  )
}
