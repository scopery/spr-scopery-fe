/**
 * Permission keys — mirror BE iam.types PERMISSIONS.
 */
export const PERMISSIONS = {
  WORKSPACE_VIEW: 'workspace.view',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_MANAGE_MEMBERS: 'workspace.manage_members',
  WORKSPACE_MANAGE_ROLES: 'workspace.manage_roles',
  WORKSPACE_MANAGE_TEMPLATES: 'workspace.manage_templates',
  WORKSPACE_MANAGE_SETTINGS: 'workspace.manage_settings',

  PROJECT_VIEW: 'project.view',
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',
  PROJECT_ARCHIVE: 'project.archive',
  PROJECT_DELETE: 'project.delete',
  PROJECT_MANAGE_MEMBERS: 'project.manage_members',
  PROJECT_MANAGE_DOCUMENTS: 'project.manage_documents',
  PROJECT_MANAGE_SECTIONS: 'project.manage_sections',
  PROJECT_VIEW_ACTIVITY: 'project.view_activity',

  PROJECT_SECTION_VIEW: 'project_section.view',
  PROJECT_SECTION_CREATE: 'project_section.create',
  PROJECT_SECTION_UPDATE: 'project_section.update',
  PROJECT_SECTION_ARCHIVE: 'project_section.archive',
  PROJECT_SECTION_REORDER: 'project_section.reorder',
  PROJECT_SECTION_ADD_DOCUMENT: 'project_section.add_document',
  PROJECT_SECTION_REMOVE_DOCUMENT: 'project_section.remove_document',

  DOCUMENT_VIEW: 'document.view',
  DOCUMENT_CREATE: 'document.create',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_ARCHIVE: 'document.archive',
  DOCUMENT_DELETE: 'document.delete',
  DOCUMENT_ATTACH_TO_PROJECT: 'document.attach_to_project',
  DOCUMENT_DETACH_FROM_PROJECT: 'document.detach_from_project',
  DOCUMENT_PIN: 'document.pin',
  DOCUMENT_MOVE_SECTION: 'document.move_section',
  DOCUMENT_MANAGE_VISIBILITY: 'document.manage_visibility',
  DOCUMENT_CREATE_FROM_TEMPLATE: 'document.create_from_template',

  DOCUMENT_LINK_VIEW: 'document.link.view',
  DOCUMENT_LINK_CREATE: 'document.link.create',
  DOCUMENT_LINK_DELETE: 'document.link.delete',

  DOCUMENT_EXPORT: 'document.export',

  DOCUMENT_COMMENT_VIEW: 'document.comment.view',
  DOCUMENT_COMMENT_CREATE: 'document.comment.create',
  DOCUMENT_COMMENT_UPDATE: 'document.comment.update',
  DOCUMENT_COMMENT_RESOLVE: 'document.comment.resolve',
  DOCUMENT_COMMENT_DELETE: 'document.comment.delete',

  DOCUMENT_SUGGESTION_VIEW: 'document.suggestion.view',
  DOCUMENT_SUGGESTION_CREATE: 'document.suggestion.create',
  DOCUMENT_SUGGESTION_ACCEPT: 'document.suggestion.accept',
  DOCUMENT_SUGGESTION_REJECT: 'document.suggestion.reject',
  DOCUMENT_SUGGESTION_DELETE: 'document.suggestion.delete',

  DOCUMENT_SHARE_INTERNAL: 'document.share_internal',
  DOCUMENT_MANAGE_COLLABORATORS: 'document.manage_collaborators',
  DOCUMENT_ACTIVITY_VIEW: 'document.activity.view',

  USER_MENTION: 'user.mention',

  TEMPLATE_VIEW: 'template.view',
  TEMPLATE_CREATE: 'template.create',
  TEMPLATE_UPDATE: 'template.update',
  TEMPLATE_ARCHIVE: 'template.archive',
  TEMPLATE_DUPLICATE: 'template.duplicate',
  TEMPLATE_PUBLISH_SYSTEM: 'template.publish_system',
  TEMPLATE_CREATE_PERSONAL: 'template.create_personal',
  TEMPLATE_VARIABLE_VIEW: 'template.variable.view',
  TEMPLATE_VARIABLE_INSERT: 'template.variable.insert',
  TEMPLATE_VARIABLE_PREVIEW: 'template.variable.preview',

  AI_GENERATE_QUESTIONS: 'ai.generate_questions',
  AI_ASSESS_CLARITY: 'ai.assess_clarity',
  AI_VIEW_READINESS: 'ai.view_readiness',
  AI_GENERATE_DOCUMENT: 'ai.generate_document',
  AI_SUMMARIZE_DOCUMENT: 'ai.summarize_document',
  AI_SUMMARIZE_PROJECT_DOCUMENTS: 'ai.summarize_project_documents',
  AI_FIND_RELATED_DOCUMENTS: 'ai.find_related_documents',
  AI_GENERATE_PROJECT_BRIEF: 'ai.generate_project_brief',
  AI_GENERATE_READINESS_REPORT_DOCUMENT: 'ai.generate_readiness_report_document',
  AI_GENERATE_CLARITY_REPORT_DOCUMENT: 'ai.generate_clarity_report_document',
  AI_GENERATE_QA_SUMMARY_DOCUMENT: 'ai.generate_qa_summary_document',

  DOCUMENT_VIEW_AI_METADATA: 'document.view_ai_metadata',
  DOCUMENT_MARK_AI_GENERATED: 'document.mark_ai_generated',

  DOCUMENT_HUB_VIEW: 'document_hub.view',
  DOCUMENT_HUB_SEARCH: 'document_hub.search',
  DOCUMENT_HUB_FILTER: 'document_hub.filter',
  DOCUMENT_HUB_VIEW_WORKSPACE: 'document_hub.view_workspace',
  DOCUMENT_HUB_VIEW_PROJECT: 'document_hub.view_project',
  DOCUMENT_HUB_MANAGE: 'document_hub.manage',

  GOVERNANCE_VIEW: 'governance.view',
  GOVERNANCE_MANAGE: 'governance.manage',
  GOVERNANCE_EVALUATE: 'governance.evaluate',
  AGENT_CONTROL_VIEW: 'agent_control.view',
  AGENT_CONTROL_MANAGE: 'agent_control.manage',
  PROMPT_REGISTRY_VIEW: 'prompt_registry.view',
  PROMPT_REGISTRY_MANAGE: 'prompt_registry.manage',
  AGENT_RUNTIME_VIEW: 'agent_runtime.view',
  AI_USAGE_VIEW: 'ai_usage.view',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export interface EffectivePermissions {
  permissions: string[]
  roles: string[]
  org_role?: string | null
  project_role?: string | null
}
