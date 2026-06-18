'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, Input, Select, Typography, Button, ContentLoader } from '@/shared/ui'
import * as deliverablesService from '@/services/document-deliverables.service'
import * as sessionService from '@/services/session.service'
import * as projectService from '@/services/project.service'
import {
  DELIVERABLE_TYPE_LABELS,
  getAvailableDeliverableTypes,
  getEffectiveSourceForDeliverable,
  type DeliverableEntryContext,
  type DeliverablePreviewResult,
  type DeliverableSourceEntityType,
  type DeliverableTemplateListItem,
  type DeliverableType,
} from '@/types/document-deliverable'
import { DeliverableDocumentSetSummary } from './DeliverableDocumentSetSummary'
import { DeliverableDocumentSetPicker } from './DeliverableDocumentSetPicker'
import { DeliverableReadinessWarnings } from './DeliverableReadinessWarnings'
import {
  getGovernanceBlockedReasons,
  getGovernanceWarningMessages,
  isGovernancePreviewDenied,
} from '@/utils/governanceError'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { toast } from 'sonner'
import { cn } from '@/utils'

interface CreateDeliverableDialogProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: (documentId: string) => void
  entryContext?: DeliverableEntryContext
  initialDeliverableType?: DeliverableType
  initialSourceEntityType?: DeliverableSourceEntityType
  initialSourceEntityId?: string
  initialSelectedDocumentIds?: string[]
  selectedDocumentTitles?: string[]
  lockDeliverableType?: DeliverableType
}

export function CreateDeliverableDialog({
  orgId,
  projectId,
  open,
  onClose,
  onSuccess,
  entryContext = 'project_documents',
  initialDeliverableType,
  initialSourceEntityType,
  initialSourceEntityId,
  initialSelectedDocumentIds = [],
  selectedDocumentTitles: initialSelectedDocumentTitles = [],
  lockDeliverableType,
}: CreateDeliverableDialogProps) {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>(initialSelectedDocumentIds)
  const [selectedDocumentTitles, setSelectedDocumentTitles] = useState<string[]>(
    initialSelectedDocumentTitles
  )

  const hasDocumentSet = selectedDocumentIds.length > 0
  const defaultSource: DeliverableSourceEntityType =
    initialSourceEntityType ??
    (hasDocumentSet ? 'document_set' : lockDeliverableType ? getEffectiveSourceForDeliverable(lockDeliverableType, false) : 'project')

  const defaultType =
    lockDeliverableType ??
    initialDeliverableType ??
    (hasDocumentSet ? 'evidence_index_document' : 'project_brief')

  const [deliverableType, setDeliverableType] = useState<DeliverableType>(defaultType)
  const [templates, setTemplates] = useState<DeliverableTemplateListItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DeliverableTemplateListItem | null>(null)
  const [title, setTitle] = useState('')
  const [sourceEntityId, setSourceEntityId] = useState(initialSourceEntityId ?? '')
  const [includeAnswerContent, setIncludeAnswerContent] = useState(false)
  const [includeArchivedDocuments, setIncludeArchivedDocuments] = useState(false)
  const [includeEvidenceIndex, setIncludeEvidenceIndex] = useState(true)
  const [sessions, setSessions] = useState<Array<{ id: string; name: string }>>([])
  const [requirements, setRequirements] = useState<Array<{ id: string; label: string }>>([])
  const [preview, setPreview] = useState<DeliverablePreviewResult | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const effectiveSource = getEffectiveSourceForDeliverable(deliverableType, hasDocumentSet)
  const availableTypes = getAvailableDeliverableTypes(
    lockDeliverableType ? getEffectiveSourceForDeliverable(lockDeliverableType, hasDocumentSet) : effectiveSource,
    lockDeliverableType
  )

  const deliverableTypeOptions = availableTypes.map((value) => ({
    value,
    label: DELIVERABLE_TYPE_LABELS[value],
  }))

  const showDocumentSetPicker =
    deliverableType === 'evidence_index_document' ||
    deliverableType === 'decision_log' ||
    hasDocumentSet

  const resetState = useCallback(() => {
    setSelectedDocumentIds(initialSelectedDocumentIds)
    setSelectedDocumentTitles(initialSelectedDocumentTitles)
    setDeliverableType(defaultType)
    setTemplates([])
    setSelectedTemplate(null)
    setTitle('')
    setSourceEntityId(initialSourceEntityId ?? '')
    setIncludeAnswerContent(false)
    setIncludeArchivedDocuments(false)
    setIncludeEvidenceIndex(true)
    setPreview(null)
  }, [defaultType, initialSourceEntityId, initialSelectedDocumentIds, initialSelectedDocumentTitles])

  useEffect(() => {
    if (open) {
      setSelectedDocumentIds(initialSelectedDocumentIds)
      setSelectedDocumentTitles(initialSelectedDocumentTitles)
    }
  }, [open, initialSelectedDocumentIds, initialSelectedDocumentTitles])

  useEffect(() => {
    if (!open) resetState()
  }, [open, resetState])

  useEffect(() => {
    if (!open) return
    setTemplatesLoading(true)
    void deliverablesService
      .listDeliverableTemplates(orgId, projectId, { source_entity_type: effectiveSource })
      .then((res) => setTemplates(res.items))
      .catch(() => toast.error('Failed to load deliverable templates'))
      .finally(() => setTemplatesLoading(false))
  }, [open, orgId, projectId, effectiveSource])

  useEffect(() => {
    if (!availableTypes.includes(deliverableType)) {
      setDeliverableType(availableTypes[0] ?? 'project_brief')
    }
  }, [availableTypes, deliverableType])

  useEffect(() => {
    const match = templates.find((t) => t.deliverable_type === deliverableType) ?? null
    setSelectedTemplate(match)
    if (match && !title.trim()) setTitle(match.title)
    setPreview(null)
  }, [deliverableType, templates, title])

  useEffect(() => {
    if (!open || effectiveSource !== 'session') return
    setSourcesLoading(true)
    void sessionService
      .listSessions(orgId, projectId, { limit: 100 })
      .then((res) => setSessions(res.items.map((s) => ({ id: s.id, name: s.name }))))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setSourcesLoading(false))
  }, [open, orgId, projectId, effectiveSource])

  useEffect(() => {
    if (!open || effectiveSource !== 'requirement') return
    setSourcesLoading(true)
    void projectService
      .listRequirements(orgId, projectId, { limit: 100 })
      .then((res) =>
        setRequirements(res.items.map((r) => ({ id: r.id, label: `${r.code} — ${r.title}` })))
      )
      .catch(() => toast.error('Failed to load requirements'))
      .finally(() => setSourcesLoading(false))
  }, [open, orgId, projectId, effectiveSource])

  const buildPayload = useMemo(() => {
    const sourceType = effectiveSource
    const needsSelectedDocs =
      sourceType === 'document_set' ||
      deliverableType === 'evidence_index_document' ||
      deliverableType === 'decision_log'

    return {
      template_key: selectedTemplate?.template_key ?? undefined,
      template_id: selectedTemplate?.template_key ? undefined : selectedTemplate?.id,
      deliverable_type: deliverableType,
      source_entity_type: sourceType,
      source_entity_id:
        sourceType === 'project' || sourceType === 'document_set'
          ? projectId
          : sourceEntityId || initialSourceEntityId || undefined,
      title: title.trim() || undefined,
      include_answer_content: includeAnswerContent,
      include_archived_documents: includeArchivedDocuments,
      selected_document_ids: needsSelectedDocs ? selectedDocumentIds : undefined,
      entry_point: entryContext,
      options: {
        include_evidence_index: includeEvidenceIndex,
        include_linked_documents_summary: true,
      },
    }
  }, [
    deliverableType,
    selectedTemplate,
    effectiveSource,
    projectId,
    sourceEntityId,
    initialSourceEntityId,
    title,
    includeAnswerContent,
    includeArchivedDocuments,
    includeEvidenceIndex,
    selectedDocumentIds,
    entryContext,
  ])

  const handlePreview = async () => {
    if (!selectedTemplate) {
      toast.error('No template available for this deliverable type')
      return
    }
    if (effectiveSource === 'session' && !sourceEntityId && !initialSourceEntityId) {
      toast.error('Select a session')
      return
    }
    if (effectiveSource === 'requirement' && !sourceEntityId && !initialSourceEntityId) {
      toast.error('Select a requirement')
      return
    }
    if (
      (effectiveSource === 'document_set' || deliverableType === 'evidence_index_document') &&
      selectedDocumentIds.length === 0
    ) {
      toast.error('Select at least one document for this deliverable')
      return
    }

    if (preview?.readiness?.readiness_status === 'blocked') {
      toast.error(preview.readiness.blocking_issues[0]?.message ?? 'Deliverable is blocked')
      return
    }

    setPreviewLoading(true)
    try {
      const result = await deliverablesService.previewDeliverable(orgId, projectId, buildPayload)
      setPreview(result)
      if (!title.trim()) setTitle(result.title)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const governanceBlockedReasons = getGovernanceBlockedReasons(preview?.governance_decision)
  const governanceDenied = isGovernancePreviewDenied(preview?.governance_decision)
  const canCreateFromPreview =
    preview?.can_create &&
    !governanceDenied &&
    preview.readiness?.readiness_status !== 'blocked'

  const handleCreate = async () => {
    setCreating(true)
    try {
      let activePreview = preview
      if (!activePreview?.can_create) {
        if (!selectedTemplate) {
          toast.error('No template available')
          return
        }
        activePreview = await deliverablesService.previewDeliverable(orgId, projectId, buildPayload)
        setPreview(activePreview)
        if (!title.trim()) setTitle(activePreview.title)
      }
      if (
        !activePreview.can_create ||
        activePreview.readiness?.readiness_status === 'blocked' ||
        isGovernancePreviewDenied(activePreview.governance_decision)
      ) {
        const governanceReason = getGovernanceBlockedReasons(activePreview.governance_decision)[0]
        toast.error(
          governanceReason ??
            activePreview.readiness?.blocking_issues[0]?.message ??
            activePreview.blocking_errors[0] ??
            'Cannot create deliverable'
        )
        return
      }

      const result = await deliverablesService.createDeliverable(orgId, projectId, {
        ...buildPayload,
        attach_to_project: true,
        create_evidence_links: true,
      })
      const readinessLabel = result.readiness?.readiness_status ?? 'draft'
      toast.success('Deliverable created as draft', {
        description: `${result.title} · ${readinessLabel.replace('_', ' ')}`,
        action: {
          label: 'Open',
          onClick: () => onSuccess(result.document_id),
        },
      })
      onSuccess(result.document_id)
      onClose()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create deliverable" size="lg">
      <div className="space-y-4">
        <Typography variant="body-sm" className="text-muted-foreground">
          Generate a structured draft from a controlled template using existing project data. Not
          AI generation.
        </Typography>

        {hasDocumentSet ? (
          <DeliverableDocumentSetSummary
            selectedCount={selectedDocumentIds.length}
            documentTitles={selectedDocumentTitles}
          />
        ) : null}

        {showDocumentSetPicker ? (
          <DeliverableDocumentSetPicker
            orgId={orgId}
            projectId={projectId}
            selectedIds={selectedDocumentIds}
            includeArchived={includeArchivedDocuments}
            onSelectionChange={(ids, titles) => {
              setSelectedDocumentIds(ids)
              setSelectedDocumentTitles(titles)
              setPreview(null)
            }}
          />
        ) : null}

        {!lockDeliverableType ? (
          <Select
            label="Deliverable type"
            value={deliverableType}
            onValueChange={(v: string) => setDeliverableType(v as DeliverableType)}
            options={deliverableTypeOptions}
          />
        ) : (
          <div className="rounded-md border border-border p-3">
            <Typography variant="body-sm" className="font-medium">
              {DELIVERABLE_TYPE_LABELS[lockDeliverableType]}
            </Typography>
          </div>
        )}

        {templatesLoading ? (
          <ContentLoader />
        ) : selectedTemplate ? (
          <div className="rounded-md border border-border p-3">
            <Typography variant="body-sm" className="font-medium">
              {selectedTemplate.title}
            </Typography>
            {selectedTemplate.description ? (
              <Typography variant="body-sm" className="text-muted-foreground mt-1">
                {selectedTemplate.description}
              </Typography>
            ) : null}
          </div>
        ) : (
          <Typography variant="body-sm" className="text-destructive">
            No published template found. Run template seed if needed.
          </Typography>
        )}

        <Input
          label="Document title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={selectedTemplate?.title ?? 'Title'}
        />

        {effectiveSource === 'session' && !initialSourceEntityId ? (
          sourcesLoading ? (
            <ContentLoader />
          ) : (
            <Select
              label="Elicitation session"
              value={sourceEntityId}
              onValueChange={(v: string) => setSourceEntityId(v)}
              options={[
                { value: '', label: 'Select session…' },
                ...sessions.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          )
        ) : null}

        {effectiveSource === 'requirement' && !initialSourceEntityId ? (
          sourcesLoading ? (
            <ContentLoader />
          ) : (
            <Select
              label="Requirement"
              value={sourceEntityId}
              onValueChange={(v: string) => setSourceEntityId(v)}
              options={[
                { value: '', label: 'Select requirement…' },
                ...requirements.map((r) => ({ value: r.id, label: r.label })),
              ]}
            />
          )
        ) : null}

        <div className="space-y-2">
          {effectiveSource === 'session' ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeAnswerContent}
                onChange={(e) => setIncludeAnswerContent(e.target.checked)}
              />
              Include answer content
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeArchivedDocuments}
              onChange={(e) => setIncludeArchivedDocuments(e.target.checked)}
            />
            Include archived documents
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeEvidenceIndex}
              onChange={(e) => setIncludeEvidenceIndex(e.target.checked)}
            />
            Include evidence index section
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handlePreview()}
            disabled={previewLoading || !selectedTemplate}
          >
            {previewLoading ? 'Previewing…' : 'Preview'}
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating || !selectedTemplate || governanceDenied}
          >
            {creating ? 'Creating…' : 'Create draft'}
          </Button>
        </div>

        {preview ? (
          <div className="space-y-3 rounded-md border border-border p-3">
            <Typography variant="body-sm" className="font-medium">
              Preview — {preview.title}
            </Typography>
            <DeliverableReadinessWarnings readiness={preview.readiness} />
            {governanceDenied && governanceBlockedReasons.length > 0 ? (
              <ul className="space-y-1 text-sm text-destructive">
                {governanceBlockedReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            {getGovernanceWarningMessages(preview.governance_decision).map((warning, index) => (
              <Typography
                key={`gov-warning-${index}`}
                variant="body-sm"
                className="text-amber-700 dark:text-amber-400"
              >
                {warning}
              </Typography>
            ))}
            {preview.warnings.length > 0 ? (
              <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
                {preview.warnings.map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>{warning.message}</li>
                ))}
              </ul>
            ) : null}
            {preview.blocking_errors.length > 0 ? (
              <ul className="space-y-1 text-sm text-destructive">
                {preview.blocking_errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
            <pre
              className={cn(
                'max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs',
                canCreateFromPreview ? '' : 'opacity-70'
              )}
            >
              {preview.content_preview}
            </pre>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
