/**
 * Document template types — aligned with BE document-templates API
 */

import type { DocumentType, DocumentVisibility } from './document'

export type TemplateScope = 'system' | 'personal' | 'workspace' | 'project'

export type TemplateStatus = 'draft' | 'published' | 'archived'

export type TemplateCategory =
  | 'general'
  | 'meeting'
  | 'decision'
  | 'research'
  | 'requirement'
  | 'summary'
  | 'project'

export interface DocumentTemplate {
  id: string
  org_id: string | null
  template_key: string | null
  title: string
  description: string | null
  scope: TemplateScope
  category: string | null
  document_type: DocumentType
  content: { format: 'plate'; value: unknown[] } | { format: 'plain'; body: string }
  plain_text: string
  status: TemplateStatus
  is_system: boolean
  is_published: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface PaginatedTemplatesResponse {
  items: DocumentTemplate[]
  page: { limit: number; offset: number; total: number }
}

export const TEMPLATE_SCOPE_LABEL: Record<TemplateScope, string> = {
  system: 'System',
  personal: 'My template',
  workspace: 'Workspace',
  project: 'Project',
}

export const TEMPLATE_CATEGORY_LABEL: Record<string, string> = {
  general: 'General',
  meeting: 'Meeting',
  decision: 'Decision',
  research: 'Research',
  requirement: 'Requirement',
  summary: 'Summary',
  project: 'Project',
}

export function templateSnippet(plainText: string, max = 120): string {
  const t = plainText.trim()
  if (!t) return 'No preview'
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

export interface CreateDocumentFromTemplateInput {
  template_id: string
  title?: string
  document_type?: DocumentType
  visibility?: DocumentVisibility
  session_id?: string
  section_id?: string | null
}

export type TemplateVariableCategory =
  | 'project'
  | 'workspace'
  | 'document'
  | 'user'
  | 'date'
  | 'session'
  | 'assessment'

export interface TemplateVariableDefinition {
  key: string
  label: string
  description: string
  category: TemplateVariableCategory
  valueType: 'string' | 'number' | 'date'
  requiredContext: string[]
  fallback: string
  example: string
}

export interface TemplateVariableScan {
  variables: string[]
  unknown_variables: string[]
  warnings?: TemplateVariableWarning[]
}

export interface TemplateVariableWarning {
  code: 'unknown_variable' | 'missing_context' | 'used_fallback'
  variable?: string
  message: string
}

export interface TemplateVariablePreview {
  template_id: string
  mode: 'preview' | 'create_document'
  resolved_title: string
  resolved_content: { format: 'plate'; value: unknown[] }
  resolved_plain_text: string
  used_variables: string[]
  unresolved_variables: string[]
  warnings: TemplateVariableWarning[]
  detected_variables: string[]
}

export interface DocumentTemplateWithVariableScan extends DocumentTemplate {
  variable_scan?: TemplateVariableScan
}
