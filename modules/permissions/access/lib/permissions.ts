/**
 * Permission helpers — FE enforces UI by role and IAM effective permissions.
 * BE always validates server-side via iamService.
 */

import type { CollaborationPermissions } from '@/modules/collaboration'
import type { EffectivePermissions } from '../model/permissions'
import type { PermissionKey } from '../model/permissions-types'
import { PERMISSIONS } from '../model/permissions-types'
import type { ProfileStatus } from '@/shared/lib/api-enums'

export { PERMISSIONS }
export type { PermissionKey, EffectivePermissions }

export function isSuspended(status: ProfileStatus | undefined): boolean {
  return status === 'suspended'
}

export function isOrgReadonly(myOrgRole: 'owner' | 'member' | 'partner'): boolean {
  return myOrgRole === 'partner'
}

export function canEditProject(myProjectRole: 'editor' | 'viewer'): boolean {
  return myProjectRole === 'editor'
}

/** Resolve project role for display/actions. BE always returns my_role (owner => editor). */
export function resolveProjectRole(
  myRole: 'editor' | 'viewer' | undefined | null
): 'editor' | 'viewer' {
  return myRole === 'editor' ? 'editor' : 'viewer'
}

export function hasPermission(
  effective: EffectivePermissions | null | undefined,
  permission: PermissionKey | string
): boolean {
  if (!effective?.permissions?.length) return false
  return effective.permissions.includes(permission)
}

/** Fallback when effective permissions API is unavailable — legacy role mapping. */
export function canManageProjectContentFallback(
  myOrgRole: 'owner' | 'member' | 'partner',
  myProjectRole: 'editor' | 'viewer'
): boolean {
  if (isOrgReadonly(myOrgRole)) return false
  if (myOrgRole === 'owner') return true
  return canEditProject(myProjectRole)
}

export function buildDocumentSpacePermissions(
  effective: EffectivePermissions | null | undefined,
  fallbackEditable: boolean
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const p = (key: PermissionKey, _defaultValue?: boolean) =>
    effective ? hasPermission(effective, key) : fallbackEditable

  return {
    canViewDocument: p(PERMISSIONS.DOCUMENT_VIEW, true),
    canCreateDocument: p(PERMISSIONS.DOCUMENT_CREATE),
    canUpdateDocument: p(PERMISSIONS.DOCUMENT_UPDATE),
    canArchiveDocument: p(PERMISSIONS.DOCUMENT_ARCHIVE),
    canAttachDocument: p(PERMISSIONS.DOCUMENT_ATTACH_TO_PROJECT),
    canPinDocument: p(PERMISSIONS.DOCUMENT_PIN),
    canMoveDocument: p(PERMISSIONS.DOCUMENT_MOVE_SECTION),
    canDetachDocument: p(PERMISSIONS.DOCUMENT_DETACH_FROM_PROJECT),
    canCreateSection: p(PERMISSIONS.PROJECT_SECTION_CREATE),
    canUpdateSection: p(PERMISSIONS.PROJECT_SECTION_UPDATE),
    canArchiveSection: p(PERMISSIONS.PROJECT_SECTION_ARCHIVE),
    canCreateFromTemplate: p(PERMISSIONS.DOCUMENT_CREATE_FROM_TEMPLATE),
    canViewDocumentHub: p(PERMISSIONS.DOCUMENT_HUB_VIEW, true),
    canViewDocumentLinks: p(PERMISSIONS.DOCUMENT_LINK_VIEW, true),
    canCreateDocumentLinks: p(PERMISSIONS.DOCUMENT_LINK_CREATE),
    canDeleteDocumentLinks: p(PERMISSIONS.DOCUMENT_LINK_DELETE),
    canExportDocuments: effective ? hasPermission(effective, PERMISSIONS.DOCUMENT_EXPORT) : true,
  }
}

export function buildAIPermissions(
  effective: EffectivePermissions | null | undefined,
  fallbackEditable: boolean
) {
  const p = (key: PermissionKey, fallback = false) =>
    effective ? hasPermission(effective, key) : fallback

  const editorFallback = fallbackEditable

  return {
    canGenerateProjectBrief: p(PERMISSIONS.AI_GENERATE_PROJECT_BRIEF, editorFallback),
    canSummarizeDocument: p(PERMISSIONS.AI_SUMMARIZE_DOCUMENT, editorFallback),
    canSummarizeProjectDocuments: p(PERMISSIONS.AI_SUMMARIZE_PROJECT_DOCUMENTS, editorFallback),
    canFindRelatedDocuments: p(PERMISSIONS.AI_FIND_RELATED_DOCUMENTS, editorFallback),
    canSaveQASummary: p(PERMISSIONS.AI_GENERATE_QA_SUMMARY_DOCUMENT, editorFallback),
    canSaveClarityReport: p(PERMISSIONS.AI_GENERATE_CLARITY_REPORT_DOCUMENT, editorFallback),
    canSaveReadinessReport: p(PERMISSIONS.AI_GENERATE_READINESS_REPORT_DOCUMENT, editorFallback),
    canGenerateFromTemplate: p(PERMISSIONS.AI_GENERATE_DOCUMENT, editorFallback),
    canViewAIMetadata: p(PERMISSIONS.DOCUMENT_VIEW_AI_METADATA, true),
    canViewDocumentHub: p(PERMISSIONS.DOCUMENT_HUB_VIEW, true),
  }
}

export function canEditDocumentFromPermissions(
  effective: EffectivePermissions | null | undefined,
  fallbackEditable: boolean
): boolean {
  if (effective) return hasPermission(effective, PERMISSIONS.DOCUMENT_UPDATE)
  return fallbackEditable
}

export function canManageTemplatesFromPermissions(
  effective: EffectivePermissions | null | undefined,
  fallbackEditable: boolean
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const p = (key: PermissionKey, _defaultValue?: boolean) =>
    effective ? hasPermission(effective, key) : fallbackEditable

  return {
    canCreatePersonal: p(PERMISSIONS.TEMPLATE_CREATE_PERSONAL),
    canUpdate: p(PERMISSIONS.TEMPLATE_UPDATE),
    canArchive: p(PERMISSIONS.TEMPLATE_ARCHIVE),
    canDuplicate: p(PERMISSIONS.TEMPLATE_DUPLICATE),
    canPublishSystem: p(PERMISSIONS.TEMPLATE_PUBLISH_SYSTEM),
  }
}

export function buildCollaborationPermissions(
  effective: EffectivePermissions | null | undefined,
  fallbackEditable: boolean
): CollaborationPermissions {
  const p = (key: PermissionKey, fallback = false) =>
    effective ? hasPermission(effective, key) : fallback

  const editorFallback = fallbackEditable

  return {
    canViewComments: p(PERMISSIONS.DOCUMENT_COMMENT_VIEW, true),
    canCreateComment: p(PERMISSIONS.DOCUMENT_COMMENT_CREATE, editorFallback),
    canResolveComment: p(PERMISSIONS.DOCUMENT_COMMENT_RESOLVE, editorFallback),
    canViewSuggestions: p(PERMISSIONS.DOCUMENT_SUGGESTION_VIEW, true),
    canCreateSuggestion: p(PERMISSIONS.DOCUMENT_SUGGESTION_CREATE, editorFallback),
    canAcceptSuggestion: p(PERMISSIONS.DOCUMENT_SUGGESTION_ACCEPT, editorFallback),
    canRejectSuggestion: p(PERMISSIONS.DOCUMENT_SUGGESTION_REJECT, editorFallback),
    canViewActivity: p(PERMISSIONS.DOCUMENT_ACTIVITY_VIEW, true),
    canShare: p(PERMISSIONS.DOCUMENT_SHARE_INTERNAL, editorFallback),
    canManageCollaborators: p(PERMISSIONS.DOCUMENT_MANAGE_COLLABORATORS, editorFallback),
  }
}
