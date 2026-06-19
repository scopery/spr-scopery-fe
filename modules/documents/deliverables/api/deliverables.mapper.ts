import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_WORKFLOW_STATUS_OPTIONS,
} from '@/modules/documents/document'
import type { DeliverableSelectOption } from '../model/deliverables'

export function toDocumentTypeFilterOptions(): DeliverableSelectOption[] {
  return [{ value: '', label: 'All types' }, ...DOCUMENT_TYPE_OPTIONS]
}

export function toWorkflowStatusFilterOptions(): DeliverableSelectOption[] {
  return [{ value: '', label: 'All statuses' }, ...DOCUMENT_WORKFLOW_STATUS_OPTIONS]
}
