import type { DeliverableReadinessResult } from '../model/document-deliverable-types'

export interface DeliverableDocumentSetSummaryProps {
  documentTitles: string[]
  selectedCount: number
  crossProjectWarning?: string | null
}

export interface DeliverableReadinessWarningsProps {
  readiness: DeliverableReadinessResult | null | undefined
}

export interface DeliverableSelectOption {
  value: string
  label: string
}

export const DELIVERABLE_READINESS_FILTER_OPTIONS: DeliverableSelectOption[] = [
  { value: '', label: 'All readiness' },
  { value: 'ready', label: 'Ready' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'blocked', label: 'Blocked' },
]
