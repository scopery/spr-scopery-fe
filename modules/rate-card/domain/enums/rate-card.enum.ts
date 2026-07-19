/** Scope of a rate card entity — how broadly it applies. */
export const RateCardScope = {
  System: 'SYSTEM',
  Organization: 'ORGANIZATION',
  Workspace: 'WORKSPACE',
  Client: 'CLIENT',
  Project: 'PROJECT',
} as const
export type RateCardScope = (typeof RateCardScope)[keyof typeof RateCardScope]

/** Lifecycle status shared by cost roles, inflation policies, and member cost role assignments. */
export const RateCardEntityStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Archived: 'ARCHIVED',
} as const
export type RateCardEntityStatus = (typeof RateCardEntityStatus)[keyof typeof RateCardEntityStatus]

/** Lifecycle status of a rate card. */
export const RateCardStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Archived: 'ARCHIVED',
} as const
export type RateCardStatus = (typeof RateCardStatus)[keyof typeof RateCardStatus]

/** Lifecycle status of a rate card version. */
export const RateCardVersionStatus = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED',
} as const
export type RateCardVersionStatus = (typeof RateCardVersionStatus)[keyof typeof RateCardVersionStatus]

/** Inflation compounding frequency for an inflation policy. */
export const CompoundFrequency = {
  Annual: 'ANNUAL',
  Monthly: 'MONTHLY',
  None: 'NONE',
} as const
export type CompoundFrequency = (typeof CompoundFrequency)[keyof typeof CompoundFrequency]

/** Which rate (cost vs. billing) a resolution/preview should target. */
export const RateType = {
  Cost: 'COST',
  Billing: 'BILLING',
} as const
export type RateType = (typeof RateType)[keyof typeof RateType]
