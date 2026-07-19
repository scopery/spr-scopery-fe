export const AgentType = {
  Extraction: 'EXTRACTION',
  Classification: 'CLASSIFICATION',
  Summarization: 'SUMMARIZATION',
  Generation: 'GENERATION',
  Validation: 'VALIDATION',
  Recommendation: 'RECOMMENDATION',
  Other: 'OTHER',
} as const
export type AgentType = (typeof AgentType)[keyof typeof AgentType]

export const AgentStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus]

export const AgentOutputFormat = {
  Text: 'TEXT',
  Json: 'JSON',
  Markdown: 'MARKDOWN',
  Html: 'HTML',
  Table: 'TABLE',
} as const
export type AgentOutputFormat =
  (typeof AgentOutputFormat)[keyof typeof AgentOutputFormat]

export const AgentAutonomyLevel = {
  Supervised: 'SUPERVISED',
  SemiAutonomous: 'SEMI_AUTONOMOUS',
  Autonomous: 'AUTONOMOUS',
} as const
export type AgentAutonomyLevel =
  (typeof AgentAutonomyLevel)[keyof typeof AgentAutonomyLevel]

export const AgentScope = {
  Global: 'GLOBAL',
  Organization: 'ORGANIZATION',
  Workspace: 'WORKSPACE',
} as const
export type AgentScope = (typeof AgentScope)[keyof typeof AgentScope]

export const AGENT_TYPE_OPTIONS = [
  { value: AgentType.Extraction, label: 'Extraction' },
  { value: AgentType.Classification, label: 'Classification' },
  { value: AgentType.Summarization, label: 'Summarization' },
  { value: AgentType.Generation, label: 'Generation' },
  { value: AgentType.Validation, label: 'Validation' },
  { value: AgentType.Recommendation, label: 'Recommendation' },
  { value: AgentType.Other, label: 'Other' },
]

export const AGENT_OUTPUT_FORMAT_OPTIONS = [
  { value: AgentOutputFormat.Text, label: 'Text' },
  { value: AgentOutputFormat.Json, label: 'JSON' },
  { value: AgentOutputFormat.Markdown, label: 'Markdown' },
  { value: AgentOutputFormat.Html, label: 'HTML' },
  { value: AgentOutputFormat.Table, label: 'Table' },
]

export const AGENT_AUTONOMY_OPTIONS = [
  { value: AgentAutonomyLevel.Supervised, label: 'Supervised' },
  { value: AgentAutonomyLevel.SemiAutonomous, label: 'Semi-autonomous' },
  { value: AgentAutonomyLevel.Autonomous, label: 'Autonomous' },
]

export const AGENT_SCOPE_OPTIONS = [
  { value: AgentScope.Global, label: 'Global' },
  { value: AgentScope.Organization, label: 'Organization' },
  { value: AgentScope.Workspace, label: 'Workspace' },
]
