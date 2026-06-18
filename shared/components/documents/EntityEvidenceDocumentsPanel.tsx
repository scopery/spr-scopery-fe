'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, FileText, Link2, Plus, RotateCcw, Trash2, Download, FileOutput } from 'lucide-react'
import { Typography, Button, Badge, ContentLoader } from '@/shared/ui'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import * as documentLinksService from '@/services/document-links.service'
import * as documentsService from '@/services/documents.service'
import {
  DOCUMENT_RELATION_LABELS,
  type DocumentLinkedEntityType,
  type LinkedDocumentForEntity,
} from '@/types/document-link'
import { DOCUMENT_TYPE_LABEL, type DocumentType } from '@/types/document'
import { ROUTES } from '@/constants/routes'
import { AddEvidenceDocumentDialog } from './AddEvidenceDocumentDialog'
import { BulkLinkEvidenceDocumentsDialog } from './BulkLinkEvidenceDocumentsDialog'
import { DocumentTypeBadge } from './DocumentTypeBadge'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'
import { ApiError } from '@/types/api'
import * as documentExportService from '@/services/document-export.service'
import { toast } from 'sonner'
import { CreateDeliverableDialog } from './CreateDeliverableDialog'
import type { DeliverableType } from '@/types/document-deliverable'

interface EntityEvidenceDocumentsPanelProps {
  orgId: string
  projectId: string
  linkedEntityType: DocumentLinkedEntityType
  linkedEntityId: string
  sessionId?: string
  canView: boolean
  canCreateLink: boolean
  canRemoveLink: boolean
  canRestoreLink?: boolean
  canRestoreDocument?: boolean
  canExport?: boolean
  canCreateDeliverable?: boolean
  deliverableType?: DeliverableType
  enableBulkLink?: boolean
  title?: string
  emptyStateText?: string
  compact?: boolean
}

export function EntityEvidenceDocumentsPanel({
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
}: EntityEvidenceDocumentsPanelProps) {
  const canRestore = canRestoreLink ?? canRemoveLink
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
      const res = await documentLinksService.listLinkedDocumentsForEntity(orgId, {
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
      await documentLinksService.archiveDocumentLink(
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
      await documentLinksService.restoreDocumentLink(
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
      await documentsService.restoreDocument(orgId, restoreDocTarget.document_id, projectId)
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
      if (linkedEntityType === 'requirement') {
        await documentExportService.exportRequirementEvidencePack(
          orgId,
          projectId,
          linkedEntityId,
          { package_format: 'zip' }
        )
      } else {
        await documentExportService.exportSessionEvidencePack(
          orgId,
          projectId,
          linkedEntityId,
          { package_format: 'zip' }
        )
      }
      toast.success('Evidence pack exported')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export evidence pack'
      toast.error(msg)
    } finally {
      setExporting(false)
    }
  }

  if (!canView) return null

  const documentHref = (documentId: string) =>
    `${ROUTES.org.document(orgId, documentId)}?projectId=${encodeURIComponent(projectId)}`

  const activeItems = items.filter((item) => !item.archived_at && item.document_status === 'active')
  const displayItems = showArchivedLinks ? items : activeItems

  return (
    <div className={compact ? 'space-y-3' : 'border border-neutral-200 bg-white p-4 space-y-4'}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 size={compact ? 16 : 18} className="text-neutral-600" />
          <Typography weight="semibold" size={compact ? 'sm' : 'md'}>
            {title}
          </Typography>
          {!loading && activeItems.length > 0 && (
            <Badge variant="soft" tone="neutral" size="sm">
              {activeItems.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canRestore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchivedLinks((v) => !v)}
            >
              {showArchivedLinks ? 'Hide archived' : 'Show archived'}
            </Button>
          )}
          {canExport && (linkedEntityType === 'requirement' || linkedEntityType === 'session') && (
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              loading={exporting}
              disabled={!loading && activeItems.length === 0}
              onClick={() => void handleExportEvidencePack()}
            >
              Export evidence
            </Button>
          )}
          {canCreateDeliverable && deliverableType && (
            <Button
              variant="outline"
              size="sm"
              icon={<FileOutput size={14} />}
              onClick={() => setDeliverableOpen(true)}
            >
              Create deliverable
            </Button>
          )}
          {canCreateLink && enableBulkLink && !compact && (
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
              Link multiple
            </Button>
          )}
          {canCreateLink && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setAddOpen(true)}
            >
              Link document
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <ContentLoader variant="easeOut" className="w-12" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-200 px-4 py-6 text-center">
          <Typography variant="small" tone="muted">
            {showArchivedLinks
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
                className={compact ? 'border border-neutral-100 rounded p-2' : 'border border-neutral-100 rounded p-3'}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <FileText size={14} className="text-neutral-500 shrink-0" />
                      <Typography weight="medium" className="truncate">
                        {item.document_title}
                      </Typography>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-1">
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
                  <div className="flex items-center gap-1 shrink-0">
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
                        onClick={() => setRestoreLinkTarget(item)}
                      />
                    )}
                    {canRestoreDocument && isArchivedDoc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<RotateCcw size={14} />}
                        aria-label="Restore document"
                        onClick={() => setRestoreDocTarget(item)}
                      />
                    )}
                    {canRemoveLink && !isArchivedLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<Trash2 size={14} />}
                        aria-label="Remove link"
                        onClick={() => setRemoveTarget(item)}
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
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onSuccess={() => {
              setAddOpen(false)
              void load()
            }}
          />
          {enableBulkLink && (
            <BulkLinkEvidenceDocumentsDialog
              orgId={orgId}
              projectId={projectId}
              linkedEntityType={linkedEntityType}
              linkedEntityId={linkedEntityId}
              sessionId={sessionId}
              open={bulkOpen}
              onClose={() => setBulkOpen(false)}
              onSuccess={() => {
                setBulkOpen(false)
                void load()
              }}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={removeTarget != null}
        onClose={() => setRemoveTarget(null)}
        title="Remove evidence link?"
        message="This removes the link between the document and this entity. The document itself is not deleted."
        confirmLabel="Remove link"
        variant="danger"
        loading={removing}
        onConfirm={() => void handleRemove()}
      />

      <ConfirmDialog
        open={restoreLinkTarget != null}
        onClose={() => setRestoreLinkTarget(null)}
        title="Restore evidence link?"
        message="This reactivates the link between the document and this entity."
        confirmLabel="Restore link"
        variant="default"
        loading={restoring}
        onConfirm={() => void handleRestoreLink()}
      />

      <ConfirmDialog
        open={restoreDocTarget != null}
        onClose={() => setRestoreDocTarget(null)}
        title="Restore document?"
        message="This restores the archived document. Active evidence links will become visible again."
        confirmLabel="Restore document"
        variant="default"
        loading={restoring}
        onConfirm={() => void handleRestoreDocument()}
      />

      {canCreateDeliverable && deliverableType ? (
        <CreateDeliverableDialog
          orgId={orgId}
          projectId={projectId}
          open={deliverableOpen}
          onClose={() => setDeliverableOpen(false)}
          onSuccess={() => {
            setDeliverableOpen(false)
            void load()
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
