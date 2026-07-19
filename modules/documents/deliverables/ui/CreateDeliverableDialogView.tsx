'use client'

import { Eye, Plus } from 'lucide-react'

import { Modal, Input, Select, Typography, Button, Skeleton } from '@/shared/ui'
import { DELIVERABLE_TYPE_LABELS, type DeliverableType } from '@/modules/documents/deliverables'
import { DeliverableDocumentSetSummary } from './DeliverableDocumentSetSummary'
import { DeliverableDocumentSetPicker } from './DeliverableDocumentSetPicker'
import { DeliverableReadinessWarnings } from './DeliverableReadinessWarnings'
import { cn } from '@/utils/cn'
import type { CreateDeliverableDialogViewProps } from '../model/create-deliverable-dialog'

export function CreateDeliverableDialogView({
  open,
  onClose,
  orgId,
  projectId,
  hasDocumentSet,
  showDocumentSetPicker,
  lockDeliverableType,
  effectiveSource,
  initialSourceEntityId,
  deliverableType,
  deliverableTypeOptions,
  selectedTemplate,
  title,
  sourceEntityId,
  includeAnswerContent,
  includeArchivedDocuments,
  includeEvidenceIndex,
  sessionOptions,
  requirementOptions,
  preview,
  templatesLoading,
  sourcesLoading,
  previewLoading,
  creating,
  selectedDocumentIds,
  selectedDocumentTitles,
  governanceBlockedReasons,
  governanceDenied,
  canCreateFromPreview,
  governanceWarnings,
  onDeliverableTypeChange,
  onTitleChange,
  onSourceEntityIdChange,
  onIncludeAnswerContentChange,
  onIncludeArchivedDocumentsChange,
  onIncludeEvidenceIndexChange,
  onDocumentSelectionChange,
  onPreview,
  onCreate,
}: CreateDeliverableDialogViewProps) {
  return (
    <Modal open={open} onClose={onClose} title="Create deliverable" size="lg">
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Generate a structured draft from a controlled template using existing project data. Not AI
          generation.
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
            onSelectionChange={onDocumentSelectionChange}
          />
        ) : null}

        {!lockDeliverableType ? (
          <Select
            label="Deliverable type"
            value={deliverableType}
            onValueChange={(v: string) => onDeliverableTypeChange(v as DeliverableType)}
            options={deliverableTypeOptions}
          />
        ) : (
          <div className="border-border rounded-md border p-3">
            <Typography variant="small" weight="medium">
              {DELIVERABLE_TYPE_LABELS[lockDeliverableType]}
            </Typography>
          </div>
        )}

        {templatesLoading ? (
          <Skeleton variant="rectangular" width="100%" height={80} />
        ) : selectedTemplate ? (
          <div className="border-border rounded-md border p-3">
            <Typography variant="small" weight="medium">
              {selectedTemplate.title}
            </Typography>
            {selectedTemplate.description ? (
              <Typography variant="small" tone="muted" className="mt-1">
                {selectedTemplate.description}
              </Typography>
            ) : null}
          </div>
        ) : (
          <Typography variant="small" tone="error">
            No published template found. Run template seed if needed.
          </Typography>
        )}

        <Input
          label="Document title (optional)"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={selectedTemplate?.title ?? 'Title'}
        />

        {effectiveSource === 'session' && !initialSourceEntityId ? (
          sourcesLoading ? (
            <Skeleton variant="rectangular" width="100%" height={80} />
          ) : (
            <Select
              label="Elicitation session"
              value={sourceEntityId}
              onValueChange={(v: string) => onSourceEntityIdChange(v)}
              options={sessionOptions}
            />
          )
        ) : null}

        {effectiveSource === 'requirement' && !initialSourceEntityId ? (
          sourcesLoading ? (
            <Skeleton variant="rectangular" width="100%" height={80} />
          ) : (
            <Select
              label="Requirement"
              value={sourceEntityId}
              onValueChange={(v: string) => onSourceEntityIdChange(v)}
              options={requirementOptions}
            />
          )
        ) : null}

        <div className="space-y-2">
          {effectiveSource === 'session' ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeAnswerContent}
                onChange={(e) => onIncludeAnswerContentChange(e.target.checked)}
              />
              Include answer content
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeArchivedDocuments}
              onChange={(e) => onIncludeArchivedDocumentsChange(e.target.checked)}
            />
            Include archived documents
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeEvidenceIndex}
              onChange={(e) => onIncludeEvidenceIndexChange(e.target.checked)}
            />
            Include evidence index section
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onPreview}
            disabled={previewLoading || !selectedTemplate} icon={<Eye size={16} />}>
            {previewLoading ? 'Previewing…' : 'Preview'}
          </Button>
          <Button
            type="button"
            onClick={onCreate}
            disabled={creating || !selectedTemplate || governanceDenied}
           icon={<Plus size={16} />}>
            {creating ? 'Creating…' : 'Create draft'}
          </Button>
        </div>

        {preview ? (
          <div className="border-border space-y-3 rounded-md border p-3">
            <Typography variant="small" weight="medium">
              Preview — {preview.title}
            </Typography>
            <DeliverableReadinessWarnings readiness={preview.readiness} />
            {governanceDenied && governanceBlockedReasons.length > 0 ? (
              <Typography as="ul" variant="small" tone="error" className="space-y-1">
                {governanceBlockedReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </Typography>
            ) : null}
            {governanceWarnings.map((warning, index) => (
              <Typography
                key={`gov-warning-${index}`}
                variant="small"
                className="text-amber-700 dark:text-amber-400"
              >
                {warning}
              </Typography>
            ))}
            {preview.warnings.length > 0 ? (
              <Typography as="ul" variant="small" className="space-y-1 text-amber-700 dark:text-amber-400">
                {preview.warnings.map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>{warning.message}</li>
                ))}
              </Typography>
            ) : null}
            {preview.blocking_errors.length > 0 ? (
              <Typography as="ul" variant="small" tone="error" className="space-y-1">
                {preview.blocking_errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </Typography>
            ) : null}
            <pre
              className={cn(
                'bg-muted max-h-64 overflow-auto whitespace-pre-wrap rounded p-3 text-xs',
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
