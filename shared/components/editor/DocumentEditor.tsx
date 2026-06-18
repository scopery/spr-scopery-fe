'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Value } from 'platejs'
import { CircleArrowOutUpLeft, Download } from 'lucide-react'
import { Typography, Button, Input, Select, Badge } from '@/shared/ui'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_VISIBILITY_OPTIONS,
  DOCUMENT_WORKFLOW_STATUS_OPTIONS,
  WORKFLOW_TRANSITIONS,
  type Document,
  type DocumentType,
  type DocumentVisibility,
  type DocumentWorkflowStatus,
} from '@/types/document'
import * as documentsService from '@/services/documents.service'
import { downloadSingleDocumentExport } from '@/services/documents.service'
import { DocumentTypeBadge } from '@/shared/components/documents/DocumentTypeBadge'
import { DocumentVisibilityBadge } from '@/shared/components/documents/DocumentVisibilityBadge'
import { WorkflowStatusBadge } from '@/shared/components/documents/WorkflowStatusBadge'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { toast } from 'sonner'
import { PlateEditorBody } from './PlateEditor'
import { DocumentReadOnlyRenderer } from './DocumentReadOnlyRenderer'
import { contentToPlateValue, plateValueToContent } from './content-adapter'
import type { SaveStatus } from './editor.types'
import { DocumentCollaborationPanel } from '@/shared/components/collaboration/DocumentCollaborationPanel'
import type { CollaborationPermissions } from '@/types/collaboration'
import { DocumentAIPanel } from '@/shared/components/ai-document-intelligence/DocumentAIPanel'
import { AIGeneratedBadge } from '@/shared/components/ai-document-intelligence/AIGeneratedBadge'
import { DocumentLinksPanel } from '@/shared/components/documents/DocumentLinksPanel'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import { useRouter } from 'next/navigation'
import { DocumentDeliverableMetadataPanel } from '@/shared/components/documents/DocumentDeliverableMetadataPanel'

const AUTOSAVE_MS = 1000

interface DocumentEditorProps {
  orgId: string
  projectId?: string
  document: Document
  canEdit: boolean
  canArchive?: boolean
  canExport?: boolean
  linkPermissions?: {
    canView: boolean
    canCreate: boolean
    canDelete: boolean
  }
  collaborationPermissions?: CollaborationPermissions
  aiPermissions?: {
    canSummarizeDocument: boolean
    canFindRelatedDocuments: boolean
    canViewAIMetadata: boolean
  }
  backHref: string
  backLabel?: string
  onArchived?: () => void
}

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
  const router = useRouter()
  const [title, setTitle] = useState(initialDoc.title)
  const [plateValue, setPlateValue] = useState<Value>(() => contentToPlateValue(initialDoc.content))
  const [documentType, setDocumentType] = useState<DocumentType>(initialDoc.document_type)
  const [visibility, setVisibility] = useState<DocumentVisibility>(initialDoc.visibility)
  const [workflowStatus, setWorkflowStatus] = useState<DocumentWorkflowStatus>(
    initialDoc.workflow_status ?? 'draft'
  )
  const [updatedAt, setUpdatedAt] = useState(initialDoc.updated_at)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [exporting, setExporting] = useState(false)

  const saveTokenRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const payloadRef = useRef({
    title: initialDoc.title,
    plateValue: contentToPlateValue(initialDoc.content),
    documentType: initialDoc.document_type,
    visibility: initialDoc.visibility,
    workflowStatus: initialDoc.workflow_status ?? 'draft',
  })

  useEffect(() => {
    payloadRef.current = { title, plateValue, documentType, visibility, workflowStatus }
  }, [title, plateValue, documentType, visibility, workflowStatus])

  const performSave = useCallback(
    async (source: 'manual' | 'autosave') => {
      if (!canEdit) return

      const token = ++saveTokenRef.current
      const snapshot = { ...payloadRef.current }

      if (!snapshot.title.trim()) {
        setSaveStatus('error')
        toast.error('Title is required')
        return
      }

      setSaveStatus('saving')

      try {
        const saved = await documentsService.updateDocument(
          orgId,
          initialDoc.id,
          {
            title: snapshot.title.trim(),
            content: plateValueToContent(snapshot.plateValue),
            document_type: snapshot.documentType,
            visibility: snapshot.visibility,
            workflow_status: snapshot.workflowStatus,
          },
          projectId
        )

        if (token !== saveTokenRef.current) return

        setUpdatedAt(saved.updated_at)
        setSaveStatus('saved')
        if (source === 'manual') toast.success('Document saved')
      } catch (err) {
        if (token !== saveTokenRef.current) return
        setSaveStatus('error')
        toast.error(getProblemToastMessage(err))
      }
    },
    [canEdit, orgId, initialDoc.id, projectId]
  )

  const scheduleAutosave = useCallback(() => {
    if (!canEdit) return
    setSaveStatus('unsaved')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void performSave('autosave')
    }, AUTOSAVE_MS)
  }, [canEdit, performSave])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleManualSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    void performSave('manual')
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await documentsService.archiveDocument(orgId, initialDoc.id, projectId)
      toast.success('Document archived')
      setArchiveOpen(false)
      if (onArchived) {
        onArchived()
      } else {
        router.push(backHref)
      }
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setArchiving(false)
    }
  }

  const handleRestore = async () => {
    setRestoring(true)
    try {
      await documentsService.restoreDocument(orgId, initialDoc.id, projectId)
      toast.success('Document restored')
      router.refresh()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setRestoring(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadSingleDocumentExport(orgId, initialDoc.id, {
        format: 'markdown',
        project_id: projectId,
      })
      toast.success('Export downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getProblemToastMessage(err))
    } finally {
      setExporting(false)
    }
  }

  const workflowOptions = useMemo(() => {
    const allowed = WORKFLOW_TRANSITIONS[workflowStatus] ?? []
    const options = DOCUMENT_WORKFLOW_STATUS_OPTIONS.filter(
      (o) => o.value === workflowStatus || allowed.includes(o.value)
    )
    return options.map((o) => ({ value: o.value, label: o.label }))
  }, [workflowStatus])

  const statusLabel = useMemo(() => {
    switch (saveStatus) {
      case 'saved':
        return 'Saved'
      case 'saving':
        return 'Saving…'
      case 'unsaved':
        return 'Unsaved changes'
      case 'error':
        return 'Error saving'
    }
  }, [saveStatus])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link href={backHref} aria-label={backLabel}>
          <CircleArrowOutUpLeft size={20} className="text-neutral-600 hover:text-primary" />
        </Link>
        <Typography variant="small" tone="muted" aria-live="polite">
          {!canEdit ? 'Read-only' : statusLabel}
        </Typography>
        {canEdit && (
          <Button variant="primary" size="sm" loading={saveStatus === 'saving'} onClick={handleManualSave}>
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
          <Button variant="outline" size="sm" loading={restoring} onClick={() => void handleRestore()}>
            Restore
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
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
        <div className="p-6 space-y-4 border-b border-neutral-200">
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
                {canEdit ? (
                  <Select
                    value={workflowStatus}
                    onValueChange={(v: string) => {
                      setWorkflowStatus(v as DocumentWorkflowStatus)
                      scheduleAutosave()
                    }}
                    options={workflowOptions}
                  />
                ) : (
                  <WorkflowStatusBadge status={workflowStatus} />
                )}
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
                  options={DOCUMENT_VISIBILITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
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
