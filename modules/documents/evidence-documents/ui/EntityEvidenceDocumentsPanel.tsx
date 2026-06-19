'use client'

import Link from 'next/link'
import {
  Download,
  ExternalLink,
  FileOutput,
  FileText,
  Link2,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Typography, Button, Badge, ContentLoader, ConfirmDialog } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import {
  DOCUMENT_RELATION_LABELS,
  getEvidenceDocumentTypeLabel,
} from '../api/evidence-documents.api'
import type { DocumentType } from '@/modules/documents/document'
import type { EntityEvidenceDocumentsPanelProps } from '../model/evidence-documents'
import { useEntityEvidenceDocumentsPanel } from '../hooks/useEntityEvidenceDocumentsPanel'
import { AddEvidenceDocumentDialog } from './AddEvidenceDocumentDialog'
import { BulkLinkEvidenceDocumentsDialog } from './BulkLinkEvidenceDocumentsDialog'
import { CreateDeliverableDialog } from '@/modules/documents/deliverables/ui/CreateDeliverableDialog'
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
    canExport = false,
    canCreateDeliverable = false,
    deliverableType,
    enableBulkLink = true,
    title = 'Evidence documents',
    emptyStateText = 'No evidence documents linked yet.',
    compact = false,
  } = props
  const panel = useEntityEvidenceDocumentsPanel(props)
  const canRestore = canRestoreLink ?? canRemoveLink

  if (!canView) return null

  const documentHref = (documentId: string) =>
    `${ROUTES.org.document(orgId, documentId)}?projectId=${encodeURIComponent(projectId)}`

  const activeItems = panel.items.filter(
    (item) => !item.archived_at && item.document_status === 'active'
  )
  const displayItems = panel.showArchivedLinks ? panel.items : activeItems

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4 border border-neutral-200 bg-white p-4'}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 size={compact ? 16 : 18} className="text-neutral-600" />
          <Typography weight="semibold" size={compact ? 'sm' : 'md'}>
            {title}
          </Typography>
          {!panel.loading && activeItems.length > 0 && (
            <Badge variant="soft" tone="neutral" size="sm">
              {activeItems.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canRestore && (
            <Button variant="ghost" size="sm" onClick={() => panel.setShowArchivedLinks((v) => !v)}>
              {panel.showArchivedLinks ? 'Hide archived' : 'Show archived'}
            </Button>
          )}
          {canExport && (linkedEntityType === 'requirement' || linkedEntityType === 'session') && (
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              loading={panel.exporting}
              disabled={!panel.loading && activeItems.length === 0}
              onClick={() => void panel.handleExportEvidencePack()}
            >
              Export evidence
            </Button>
          )}
          {canCreateDeliverable && deliverableType && (
            <Button
              variant="outline"
              size="sm"
              icon={<FileOutput size={14} />}
              onClick={() => panel.setDeliverableOpen(true)}
            >
              Create deliverable
            </Button>
          )}
          {canCreateLink && enableBulkLink && !compact && (
            <Button variant="outline" size="sm" onClick={() => panel.setBulkOpen(true)}>
              Link multiple
            </Button>
          )}
          {canCreateLink && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => panel.setAddOpen(true)}
            >
              Link document
            </Button>
          )}
        </div>
      </div>

      {panel.loading ? (
        <div className="flex justify-center py-4">
          <ContentLoader variant="easeOut" className="w-12" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-200 px-4 py-6 text-center">
          <Typography variant="small" tone="muted">
            {panel.showArchivedLinks
              ? 'No archived evidence links for this entity.'
              : emptyStateText}
          </Typography>
        </div>
      ) : (
        <ul className="space-y-2">
          {displayItems.map((item) => {
            const docType = item.document_type as DocumentType
            const workflowStatus = item.workflow_status as 'draft' | 'in_review' | 'approved'
            const isArchivedLink = item.archived_at != null
            const isArchivedDoc = item.document_status === 'archived'
            return (
              <li
                key={item.id}
                className={
                  compact
                    ? 'rounded border border-neutral-100 p-2'
                    : 'rounded border border-neutral-100 p-3'
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <FileText size={14} className="shrink-0 text-neutral-500" />
                      <Typography weight="medium" className="truncate">
                        {item.document_title}
                      </Typography>
                    </div>
                    <div className="mb-1 flex flex-wrap gap-2">
                      <DocumentTypeBadge type={docType} />
                      {workflowStatus && <WorkflowStatusBadge status={workflowStatus} />}
                      <Badge variant="soft" tone="info" size="sm">
                        {DOCUMENT_RELATION_LABELS[item.relation_type]}
                      </Badge>
                      {isArchivedLink && (
                        <Badge variant="soft" tone="warning" size="sm">
                          Link archived
                        </Badge>
                      )}
                      {isArchivedDoc && (
                        <Badge variant="soft" tone="warning" size="sm">
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
                        size="sm"
                        iconOnly
                        icon={<ExternalLink size={14} />}
                        aria-label="Open document"
                      />
                    )}
                    {canRestore && isArchivedLink && !isArchivedDoc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<RotateCcw size={14} />}
                        aria-label="Restore link"
                        onClick={() => panel.setRestoreLinkTarget(item)}
                      />
                    )}
                    {canRestoreDocument && isArchivedDoc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<RotateCcw size={14} />}
                        aria-label="Restore document"
                        onClick={() => panel.setRestoreDocTarget(item)}
                      />
                    )}
                    {canRemoveLink && !isArchivedLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<Trash2 size={14} />}
                        aria-label="Remove link"
                        onClick={() => panel.setRemoveTarget(item)}
                      />
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {canCreateLink && (
        <>
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
            }}
          />
          {enableBulkLink && (
            <BulkLinkEvidenceDocumentsDialog
              orgId={orgId}
              projectId={projectId}
              linkedEntityType={linkedEntityType}
              linkedEntityId={linkedEntityId}
              sessionId={sessionId}
              open={panel.bulkOpen}
              onClose={() => panel.setBulkOpen(false)}
              onSuccess={() => {
                panel.setBulkOpen(false)
                void panel.load()
              }}
            />
          )}
        </>
      )}

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

      {canCreateDeliverable && deliverableType ? (
        <CreateDeliverableDialog
          orgId={orgId}
          projectId={projectId}
          open={panel.deliverableOpen}
          onClose={() => panel.setDeliverableOpen(false)}
          onSuccess={() => {
            panel.setDeliverableOpen(false)
            void panel.load()
          }}
          entryContext={
            linkedEntityType === 'session' ? 'session_evidence' : 'requirement_evidence'
          }
          lockDeliverableType={deliverableType}
          initialDeliverableType={deliverableType}
          initialSourceEntityType={
            linkedEntityType === 'session' || linkedEntityType === 'requirement'
              ? linkedEntityType
              : undefined
          }
          initialSourceEntityId={linkedEntityId}
        />
      ) : null}
    </div>
  )
}
