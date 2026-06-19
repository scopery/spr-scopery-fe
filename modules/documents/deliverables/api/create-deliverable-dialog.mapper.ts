import { DELIVERABLE_TYPE_LABELS, type DeliverableType } from '../model/document-deliverable-types'
import type {
  BuildDeliverablePayloadInput,
  CreateDeliverableSelectOption,
} from '../model/create-deliverable-dialog'

export function toDeliverableTypeOptions(
  types: DeliverableType[]
): CreateDeliverableSelectOption[] {
  return types.map((value) => ({
    value,
    label: DELIVERABLE_TYPE_LABELS[value],
  }))
}

export function toSessionSelectOptions(
  sessions: Array<{ id: string; name: string }>
): CreateDeliverableSelectOption[] {
  return [
    { value: '', label: 'Select session…' },
    ...sessions.map((s) => ({ value: s.id, label: s.name })),
  ]
}

export function toRequirementSelectOptions(
  requirements: Array<{ id: string; label: string }>
): CreateDeliverableSelectOption[] {
  return [
    { value: '', label: 'Select requirement…' },
    ...requirements.map((r) => ({ value: r.id, label: r.label })),
  ]
}

export function buildDeliverablePayload(input: BuildDeliverablePayloadInput) {
  const sourceType = input.effectiveSource
  const needsSelectedDocs =
    sourceType === 'document_set' ||
    input.deliverableType === 'evidence_index_document' ||
    input.deliverableType === 'decision_log'

  return {
    template_key: input.selectedTemplate?.template_key ?? undefined,
    template_id: input.selectedTemplate?.template_key ? undefined : input.selectedTemplate?.id,
    deliverable_type: input.deliverableType,
    source_entity_type: sourceType,
    source_entity_id:
      sourceType === 'project' || sourceType === 'document_set'
        ? input.projectId
        : input.sourceEntityId || input.initialSourceEntityId || undefined,
    title: input.title.trim() || undefined,
    include_answer_content: input.includeAnswerContent,
    include_archived_documents: input.includeArchivedDocuments,
    selected_document_ids: needsSelectedDocs ? input.selectedDocumentIds : undefined,
    entry_point: input.entryContext,
    options: {
      include_evidence_index: input.includeEvidenceIndex,
      include_linked_documents_summary: true,
    },
  }
}
