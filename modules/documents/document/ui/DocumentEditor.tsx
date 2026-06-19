'use client'

import Link from 'next/link'
import { CircleArrowOutUpLeft, Download } from 'lucide-react'
import { Typography, Button, Input, Select, Badge, ConfirmDialog } from '@/shared/ui'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_VISIBILITY_OPTIONS,
  type DocumentType,
  type DocumentVisibility,
  type DocumentWorkflowStatus,
} from '@/modules/documents/document'
import { DocumentTypeBadge } from './DocumentTypeBadge'
import { DocumentVisibilityBadge } from './DocumentVisibilityBadge'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'
import { DocumentLinksPanel } from '@/modules/documents/document-links/ui/DocumentLinksPanel'
import { DocumentDeliverableMetadataPanel } from '@/modules/documents/deliverables/ui/DocumentDeliverableMetadataPanel'
import { DocumentCollaborationPanel } from '@/modules/collaboration'
import { DocumentAIPanel, AIGeneratedBadge } from '@/modules/ai-document-intelligence'
import type { DocumentEditorProps } from '../model/document-editor'
import { useDocumentEditor } from '../hooks/useDocumentEditor'
import { PlateEditorBody } from './editor/PlateEditor'
import { DocumentReadOnlyRenderer } from './editor/DocumentReadOnlyRenderer'

export function DocumentEditor({
  orgId,
  projectId,
  document: initialDoc,
  canEdit,
  canArchive = false,
  canExport = true,
  linkPermissions,
  collaborationPermissions,
  aiPermissions,
  backHref,
  backLabel = 'Back to documents',
  onArchived,
}: DocumentEditorProps) {
  const {
    title,
    setTitle,
    plateValue,
    setPlateValue,
    documentType,
    setDocumentType,
    visibility,
    setVisibility,
    workflowStatus,
    setWorkflowStatus,
    updatedAt,
    saveStatus,
    archiveOpen,
    setArchiveOpen,
    archiving,
    restoring,
    exporting,
    workflowOptions,
    statusLabel,
    scheduleAutosave,
    handleManualSave,
    handleArchive,
    handleRestore,
    handleExport,
  } = useDocumentEditor({
    orgId,
    projectId,
    document: initialDoc,
    canEdit,
    canExport,
    backHref,
    onArchived,
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link href={backHref} aria-label={backLabel}>
            <CircleArrowOutUpLeft size={20} className="text-neutral-600 hover:text-primary" />
          </Link>
          <Typography variant="small" tone="muted" aria-live="polite">
            {!canEdit ? 'Read-only' : statusLabel}
          </Typography>
          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              loading={saveStatus === 'saving'}
              onClick={handleManualSave}
            >
              Save
            </Button>
          )}
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              loading={exporting}
              onClick={() => void handleExport()}
            >
              Export
            </Button>
          )}
          {canArchive && initialDoc.status === 'active' && (
            <Button variant="outline" size="sm" tone="error" onClick={() => setArchiveOpen(true)}>
              Archive
            </Button>
          )}
          {canArchive && initialDoc.status === 'archived' && (
            <Button
              variant="outline"
              size="sm"
              loading={restoring}
              onClick={() => void handleRestore()}
            >
              Restore
            </Button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <DocumentTypeBadge type={documentType} />
          <DocumentVisibilityBadge visibility={visibility} />
          <WorkflowStatusBadge status={workflowStatus} />
          <AIGeneratedBadge
            generatedByAI={initialDoc.generated_by_ai}
            originType={initialDoc.origin_type}
          />
          {!canEdit && (
            <Badge variant="soft" tone="neutral" size="sm">
              Read-only
            </Badge>
          )}
          <Badge variant="soft" tone="neutral" size="sm">
            Updated {new Date(updatedAt).toLocaleString()}
          </Badge>
        </div>

        <div className="border border-neutral-200 bg-white">
          <div className="space-y-4 border-b border-neutral-200 p-6">
            <Input
              label="Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                scheduleAutosave()
              }}
              readOnly={!canEdit}
              fullWidth
            />

            {canEdit && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Typography variant="small" weight="medium" className="mb-1 block">
                    Type
                  </Typography>
                  <Select
                    value={documentType}
                    onValueChange={(v: string) => {
                      setDocumentType(v as DocumentType)
                      scheduleAutosave()
                    }}
                    options={DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </div>
                <div>
                  <Typography variant="small" weight="medium" className="mb-1 block">
                    Workflow status
                  </Typography>
                  <Select
                    value={workflowStatus}
                    onValueChange={(v: string) => {
                      setWorkflowStatus(v as DocumentWorkflowStatus)
                      scheduleAutosave()
                    }}
                    options={workflowOptions}
                  />
                </div>
                <div>
                  <Typography variant="small" weight="medium" className="mb-1 block">
                    Visibility
                  </Typography>
                  <Select
                    value={visibility}
                    onValueChange={(v: string) => {
                      setVisibility(v as DocumentVisibility)
                      scheduleAutosave()
                    }}
                    options={DOCUMENT_VISIBILITY_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {canEdit ? (
            <PlateEditorBody
              key={initialDoc.id}
              value={plateValue}
              onChange={(value) => {
                setPlateValue(value)
                scheduleAutosave()
              }}
              placeholder="Start writing…"
            />
          ) : (
            <DocumentReadOnlyRenderer content={initialDoc.content} />
          )}
        </div>
      </div>

      {collaborationPermissions &&
        (collaborationPermissions.canViewComments ||
          collaborationPermissions.canViewSuggestions ||
          collaborationPermissions.canViewActivity ||
          collaborationPermissions.canShare) && (
          <DocumentCollaborationPanel
            orgId={orgId}
            documentId={initialDoc.id}
            projectId={projectId}
            permissions={collaborationPermissions}
          />
        )}

      {aiPermissions && (
        <DocumentAIPanel
          orgId={orgId}
          documentId={initialDoc.id}
          projectId={projectId}
          documentTitle={title}
          generatedByAI={initialDoc.generated_by_ai}
          originType={initialDoc.origin_type}
          permissions={aiPermissions}
        />
      )}

      {projectId &&
        initialDoc.origin_type === 'template_generated' &&
        !initialDoc.generated_by_ai && (
          <DocumentDeliverableMetadataPanel
            orgId={orgId}
            documentId={initialDoc.id}
            projectId={projectId}
            canRefresh={canEdit}
          />
        )}

      {projectId && linkPermissions?.canView && (
        <DocumentLinksPanel
          orgId={orgId}
          projectId={projectId}
          documentId={initialDoc.id}
          canView={linkPermissions.canView}
          canCreate={linkPermissions.canCreate}
          canDelete={linkPermissions.canDelete}
        />
      )}

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive document?"
        message="Archived documents are hidden from default lists but remain in the workspace."
        confirmLabel="Archive"
        variant="danger"
        loading={archiving}
        onConfirm={() => void handleArchive()}
      />
    </div>
  )
}
