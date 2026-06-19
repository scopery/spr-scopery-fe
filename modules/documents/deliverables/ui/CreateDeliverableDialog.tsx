'use client'

import { useCreateDeliverableDialog } from '../hooks/useCreateDeliverableDialog'
import type { CreateDeliverableDialogProps } from '../model/create-deliverable-dialog'
import { CreateDeliverableDialogView } from './CreateDeliverableDialogView'

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
  const {
    hasDocumentSet,
    showDocumentSetPicker,
    effectiveSource,
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
    setDeliverableType,
    setTitle,
    setSourceEntityId,
    setIncludeAnswerContent,
    setIncludeArchivedDocuments,
    setIncludeEvidenceIndex,
    handleDocumentSelectionChange,
    handlePreview,
    handleCreate,
  } = useCreateDeliverableDialog({
    orgId,
    projectId,
    open,
    onClose,
    onSuccess,
    entryContext,
    initialDeliverableType,
    initialSourceEntityType,
    initialSourceEntityId,
    initialSelectedDocumentIds,
    initialSelectedDocumentTitles,
    lockDeliverableType,
  })

  return (
    <CreateDeliverableDialogView
      open={open}
      onClose={onClose}
      orgId={orgId}
      projectId={projectId}
      hasDocumentSet={hasDocumentSet}
      showDocumentSetPicker={showDocumentSetPicker}
      lockDeliverableType={lockDeliverableType}
      effectiveSource={effectiveSource}
      initialSourceEntityId={initialSourceEntityId}
      deliverableType={deliverableType}
      deliverableTypeOptions={deliverableTypeOptions}
      selectedTemplate={selectedTemplate}
      title={title}
      sourceEntityId={sourceEntityId}
      includeAnswerContent={includeAnswerContent}
      includeArchivedDocuments={includeArchivedDocuments}
      includeEvidenceIndex={includeEvidenceIndex}
      sessionOptions={sessionOptions}
      requirementOptions={requirementOptions}
      preview={preview}
      templatesLoading={templatesLoading}
      sourcesLoading={sourcesLoading}
      previewLoading={previewLoading}
      creating={creating}
      selectedDocumentIds={selectedDocumentIds}
      selectedDocumentTitles={selectedDocumentTitles}
      governanceBlockedReasons={governanceBlockedReasons}
      governanceDenied={governanceDenied}
      canCreateFromPreview={canCreateFromPreview}
      governanceWarnings={governanceWarnings}
      onDeliverableTypeChange={setDeliverableType}
      onTitleChange={setTitle}
      onSourceEntityIdChange={setSourceEntityId}
      onIncludeAnswerContentChange={setIncludeAnswerContent}
      onIncludeArchivedDocumentsChange={setIncludeArchivedDocuments}
      onIncludeEvidenceIndexChange={setIncludeEvidenceIndex}
      onDocumentSelectionChange={handleDocumentSelectionChange}
      onPreview={() => void handlePreview()}
      onCreate={() => void handleCreate()}
    />
  )
}
