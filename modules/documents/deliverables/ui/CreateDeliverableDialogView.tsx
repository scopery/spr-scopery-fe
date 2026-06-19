'use client'

import { Modal, Input, Select, Typography, Button, ContentLoader } from '@/shared/ui'
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
        <Typography variant="body-sm" className="text-muted-foreground">
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
            <Typography variant="body-sm" className="font-medium">
              {DELIVERABLE_TYPE_LABELS[lockDeliverableType]}
            </Typography>
          </div>
        )}

        {templatesLoading ? (
          <ContentLoader />
        ) : selectedTemplate ? (
          <div className="border-border rounded-md border p-3">
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
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={selectedTemplate?.title ?? 'Title'}
        />

        {effectiveSource === 'session' && !initialSourceEntityId ? (
          sourcesLoading ? (
            <ContentLoader />
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
            <ContentLoader />
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
            disabled={previewLoading || !selectedTemplate}
          >
            {previewLoading ? 'Previewing…' : 'Preview'}
          </Button>
          <Button
            type="button"
            onClick={onCreate}
            disabled={creating || !selectedTemplate || governanceDenied}
          >
            {creating ? 'Creating…' : 'Create draft'}
          </Button>
        </div>

        {preview ? (
          <div className="border-border space-y-3 rounded-md border p-3">
            <Typography variant="body-sm" className="font-medium">
              Preview — {preview.title}
            </Typography>
            <DeliverableReadinessWarnings readiness={preview.readiness} />
            {governanceDenied && governanceBlockedReasons.length > 0 ? (
              <ul className="text-destructive space-y-1 text-sm">
                {governanceBlockedReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            {governanceWarnings.map((warning, index) => (
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
              <ul className="text-destructive space-y-1 text-sm">
                {preview.blocking_errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
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
