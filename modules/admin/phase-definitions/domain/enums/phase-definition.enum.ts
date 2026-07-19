export const PhaseDefinitionScope = {
  System: 'SYSTEM',
  Organization: 'ORGANIZATION',
  Workspace: 'WORKSPACE',
} as const
export type PhaseDefinitionScope = (typeof PhaseDefinitionScope)[keyof typeof PhaseDefinitionScope]

export const PhaseDefinitionStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Archived: 'ARCHIVED',
} as const
export type PhaseDefinitionStatus =
  (typeof PhaseDefinitionStatus)[keyof typeof PhaseDefinitionStatus]
