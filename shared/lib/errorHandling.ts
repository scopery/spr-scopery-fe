/**
 * Centralized error UX — RFC 9457 Problem Details.
 * - 422: field-level errors (errors[].path, message)
 * - 403: "You don't have permission"
 * - 404: 404 page
 * - 409: branch by code (toast messages)
 * - 413: PAYLOAD_TOO_LARGE
 * - 429: TOO_MANY_REQUESTS toast
 * - 502: AI errors
 */

import { isProblem, getProblemCode, getProblemRequestId } from '@/shared/lib/api-types'

// Re-export so pages can import from a single place
export { getProblemRequestId, isProblem } from '@/shared/lib/api-types'
import { getGovernanceBlockedMessage } from '@/modules/governance/policy/lib/governance-error'

/** Human-readable message for toast / inline error. Use for 403, 404, 409, 413, 429, 502. */
export function getProblemToastMessage(err: unknown): string {
  const governanceMessage = getGovernanceBlockedMessage(err)
  if (governanceMessage) return governanceMessage

  if (!isProblem(err)) {
    return err instanceof Error ? err.message : 'Something went wrong.'
  }
  const code = getProblemCode(err)
  const status = err.status

  if (status === 403) return "You don't have permission to perform this action."
  if (status === 404) {
    if (code === 'AI_PROVIDER_ERROR') {
      return 'AI workflow connection error (404). Ask an admin to check the workflow ID and OpenAI configuration (project, API key).'
    }
    return 'Not found.'
  }
  if (status === 429 && code === 'TOO_MANY_REQUESTS')
    return 'Too many requests. Please try again later.'
  if (status === 413 || code === 'PAYLOAD_TOO_LARGE')
    return 'Payload too large. Reduce scope or try a smaller input.'

  if (status === 409 && code) {
    const conflictMessages: Record<string, string> = {
      ALREADY_SUBMITTED: 'Session already submitted.',
      SESSION_LOCKED: 'Session is locked or already submitted.',
      TEMPLATE_NOT_DRAFT: 'Template is not in draft state.',
      TEMPLATE_NO_ACTIVE_QUESTIONS: 'Template has no active questions.',
      LAST_OWNER: 'Cannot remove the last owner.',
      ALREADY_PROJECT_MEMBER: 'User is already a project member.',
      TEMPLATE_QUESTION_IMMUTABLE: 'Template questions cannot be edited directly.',
      INVITE_EXPIRED: 'Invite has expired.',
      INVITE_INVALID: 'Invite is invalid.',
      ALREADY_ACCEPTED: 'Invite has already been used.',
      INVITE_EMAIL_MISMATCH: 'Email does not match the invite.',
      INVITE_ALREADY_PENDING: 'An invite already exists for this email.',
      ALREADY_MEMBER: 'User is already an org member.',
      AI_BATCH_EXPIRED: 'Batch has expired or already been committed. Generate again to get a new batch.',
      AI_FEATURE_DISABLED:
        'AI v2 is not enabled on the server. Ask an admin to enable AI_WF_QGEN_V2_ENABLED and configure the workflow.',
      AI_WORKFLOW_ID_REQUIRED:
        'Server has no v2 workflow configured. Ask an admin, or try the Legacy engine.',
      NODE_CODE_EXISTS: 'A node with this code already exists in the org.',
      NODE_HAS_CHILDREN: 'Node still has child modules. Archive children first.',
      NODE_IN_USE: 'Node is in use in Project Scope or Requirement mapping.',
      SCOPE_NODE_WRONG_ORG: 'Some modules do not belong to this organization. Please reload.',
      LINK_EXISTS: 'A link between these two nodes already exists.',
      FORBIDDEN_BY_POLICY: "You don't have permission to perform this action.",
      ACTOR_KEY_EXISTS: 'An actor with this key already exists in the org.',
      REQ_CODE_EXISTS: 'A requirement with this code already exists in the project.',
      TRACE_LINK_EXISTS: 'A duplicate trace link (from/to) already exists.',
      RESOURCE_CONFLICT:
        'Conflict — the resource may already exist or was updated elsewhere. Reload and retry, or use a different code.',
      // Workspace / Org conflicts
      ORGANIZATION_CODE_ALREADY_EXISTS: 'Organization code already exists.',
      WORKSPACE_CODE_ALREADY_EXISTS: 'Workspace code already exists in this organization.',
      WORKSPACE_MEMBER_ALREADY_EXISTS: 'User is already an active member of this workspace.',
      WORKSPACE_INVITATION_ALREADY_MEMBER: 'You are already a member of this workspace.',
      WORKSPACE_ONBOARDING_ALREADY_COMPLETED: 'Onboarding already completed.',
      WORKSPACE_JOIN_REQUEST_ALREADY_PENDING: 'You already have a pending join request for this workspace.',
      WORKSPACE_JOIN_REQUEST_ALREADY_MEMBER: 'You are already a member of this workspace.',
      TEAM_CODE_ALREADY_EXISTS: 'Team code already exists in this workspace.',
      TEAM_MEMBER_ALREADY_EXISTS: 'User is already a member of this team.',
      ORG_MEMBER_ALREADY_EXISTS: 'User is already an active member of this organization.',
      ORG_INVITATION_ALREADY_MEMBER: 'User is already an active member of this organization.',
      ORG_TEAM_MEMBER_REQUIRES_ORG_MEMBER:
        'User must be an active organization member first. Invite them to the organization, then to the workspace.',
      ORG_TEAM_CODE_ALREADY_EXISTS: 'Team code already exists in this organization.',
      ORG_TEAM_MEMBER_ALREADY_EXISTS: 'User is already a member of this org team.',
      ORG_TEAM_WORKSPACE_ASSIGNMENT_ALREADY_EXISTS: 'This team is already assigned to this workspace.',
      // IAM conflicts
      IAM_USER_USERNAME_ALREADY_EXISTS: 'Username already taken.',
      IAM_USER_EMAIL_ALREADY_EXISTS: 'Email already registered.',
      IAM_ROLE_CODE_ALREADY_EXISTS: 'Role code already exists.',
      IAM_ROLE_WORKSPACE_CODE_ALREADY_EXISTS: 'Role code already exists in this workspace.',
      IAM_RIGHT_CODE_ALREADY_EXISTS: 'Right code already exists.',
      IAM_AUTH_RESOURCE_CODE_ALREADY_EXISTS: 'Resource code already exists for this type.',
      IAM_ACCESS_GRANT_ALREADY_EXISTS: 'Access grant already exists for this subject and resource.',
      IAM_ACCESS_GRANT_RIGHT_ALREADY_EXISTS: 'Right is already attached to this grant.',
      IAM_ACCESS_GRANT_PERMISSION_ACTION_ALREADY_EXISTS: 'Permission action is already attached to this grant.',
      IAM_ROLE_ASSIGNMENT_ALREADY_EXISTS: 'Duplicate active role assignment.',
    }
    if (conflictMessages[code]) return conflictMessages[code]
  }

  if ((status === 502 || status === 404) && code === 'AI_PROVIDER_ERROR') {
    return 'AI workflow connection error (404). Ask an admin to check the workflow ID and OpenAI configuration (project, API key).'
  }
  if (status === 502 && code) {
    if (['AI_BAD_OUTPUT', 'AI_OUTPUT_NOT_JSON', 'AI_OUTPUT_SCHEMA_MISMATCH'].includes(code)) {
      return 'AI failed to generate valid output. Try again.'
    }
  }

  return err.problem.detail || err.problem.title || `Error (${status})`
}

/** Message + request_id for error modal (always show request_id for debug). */
export function getProblemForModal(err: unknown): { message: string; request_id?: string } {
  return {
    message: getProblemToastMessage(err),
    request_id: getProblemRequestId(err),
  }
}

/** Field-level errors for 422 validation. Map path → message for form fields. */
export function getFieldErrors(err: unknown): Record<string, string> {
  if (!isProblem(err) || err.status !== 422 || !Array.isArray(err.problem.errors)) {
    return {}
  }
  const out: Record<string, string> = {}
  for (const e of err.problem.errors) {
    const path = e.path || 'form'
    out[path] = e.message || 'Invalid'
  }
  return out
}

/** Whether error is 409 with given code (for branching). */
export function isConflictCode(err: unknown, code: string): boolean {
  return isProblem(err) && err.status === 409 && getProblemCode(err) === code
}
