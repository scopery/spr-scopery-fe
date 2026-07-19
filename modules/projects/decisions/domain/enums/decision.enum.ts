export const DecisionStatus = {
  Pending: 'PENDING',
  Decided: 'DECIDED',
  Rejected: 'REJECTED',
  Superseded: 'SUPERSEDED',
  Archived: 'ARCHIVED',
} as const
export type DecisionStatus = (typeof DecisionStatus)[keyof typeof DecisionStatus]

export const DecisionCategory = {
  Technical: 'TECHNICAL',
  Business: 'BUSINESS',
  Scope: 'SCOPE',
  Process: 'PROCESS',
  Other: 'OTHER',
} as const
export type DecisionCategory = (typeof DecisionCategory)[keyof typeof DecisionCategory]
