export const PromptTemplateStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type PromptTemplateStatus =
  (typeof PromptTemplateStatus)[keyof typeof PromptTemplateStatus]

export const PromptVersionStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type PromptVersionStatus =
  (typeof PromptVersionStatus)[keyof typeof PromptVersionStatus]

export const PromptContentFormat = {
  Text: 'TEXT',
  Markdown: 'MARKDOWN',
  Json: 'JSON',
} as const
export type PromptContentFormat =
  (typeof PromptContentFormat)[keyof typeof PromptContentFormat]

export const PROMPT_CONTENT_FORMAT_OPTIONS = [
  { value: PromptContentFormat.Text, label: 'Text' },
  { value: PromptContentFormat.Markdown, label: 'Markdown' },
  { value: PromptContentFormat.Json, label: 'JSON' },
]

export const PROMPT_VERSION_STATUS_OPTIONS = [
  { value: PromptVersionStatus.Draft, label: 'Draft' },
  { value: PromptVersionStatus.Active, label: 'Active' },
  { value: PromptVersionStatus.Archived, label: 'Archived' },
]
