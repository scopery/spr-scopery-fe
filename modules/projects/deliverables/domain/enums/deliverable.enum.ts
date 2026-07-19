export const DeliverableStatus = {
  Draft: 'DRAFT',
  InReview: 'IN_REVIEW',
  Accepted: 'ACCEPTED',
  Archived: 'ARCHIVED',
} as const
export type DeliverableStatus = (typeof DeliverableStatus)[keyof typeof DeliverableStatus]

export const DeliverableType = {
  Document: 'DOCUMENT',
  Artifact: 'ARTIFACT',
  Milestone: 'MILESTONE',
  Other: 'OTHER',
} as const
export type DeliverableType = (typeof DeliverableType)[keyof typeof DeliverableType]

export const AcceptanceCriteriaStatus = {
  Open: 'OPEN',
  Satisfied: 'SATISFIED',
  Waived: 'WAIVED',
} as const
export type AcceptanceCriteriaStatus =
  (typeof AcceptanceCriteriaStatus)[keyof typeof AcceptanceCriteriaStatus]
