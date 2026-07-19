import { AcceptanceCriteriaStatus, DeliverableStatus } from '../enums/deliverable.enum'

export function deliverableStatusLabel(status: string): string {
  switch (status) {
    case DeliverableStatus.Draft:
      return 'Draft'
    case DeliverableStatus.InReview:
      return 'In review'
    case DeliverableStatus.Accepted:
      return 'Accepted'
    case DeliverableStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function deliverableStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'error' {
  switch (status) {
    case DeliverableStatus.InReview:
      return 'warning'
    case DeliverableStatus.Accepted:
      return 'success'
    case DeliverableStatus.Archived:
      return 'error'
    default:
      return 'neutral'
  }
}

export function canAcceptDeliverable(deliverable: { status: string }): boolean {
  return deliverable.status !== DeliverableStatus.Accepted && deliverable.status !== DeliverableStatus.Archived
}

export function canArchiveDeliverable(deliverable: { status: string }): boolean {
  return deliverable.status !== DeliverableStatus.Archived
}

export function canReopenDeliverable(deliverable: { status: string }): boolean {
  return deliverable.status === DeliverableStatus.Accepted
}

export function acceptanceCriteriaStatusLabel(status: string): string {
  switch (status) {
    case AcceptanceCriteriaStatus.Open:
      return 'Open'
    case AcceptanceCriteriaStatus.Satisfied:
      return 'Satisfied'
    case AcceptanceCriteriaStatus.Waived:
      return 'Waived'
    default:
      return status
  }
}
