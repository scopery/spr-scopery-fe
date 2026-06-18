/**
 * Centralized error UX — RFC 9457 Problem Details.
 * - 422: field-level errors (errors[].path, message)
 * - 403: "Bạn không có quyền"
 * - 404: 404 page
 * - 409: branch by code (toast messages)
 * - 413: PAYLOAD_TOO_LARGE
 * - 429: TOO_MANY_REQUESTS toast
 * - 502: AI errors
 */

import { isProblem, getProblemCode, getProblemRequestId } from '@/types/api'

// Re-export so pages can import from a single place
export { getProblemRequestId, isProblem } from '@/types/api'
import { getGovernanceBlockedMessage } from '@/utils/governanceError'

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
      return 'Lỗi kết nối workflow AI (404). Admin kiểm tra workflow ID và cấu hình OpenAI (project, API key).'
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
      AI_BATCH_EXPIRED: 'Batch đã hết hạn hoặc đã commit. Gọi lại Generate để lấy batch mới.',
      AI_FEATURE_DISABLED: 'Tính năng AI v2 chưa được bật trên server. Liên hệ admin để bật AI_WF_QGEN_V2_ENABLED và cấu hình workflow.',
      AI_WORKFLOW_ID_REQUIRED: 'Server chưa cấu hình workflow v2. Liên hệ admin hoặc thử engine Legacy.',
      NODE_CODE_EXISTS: 'Mã node đã tồn tại trong org.',
      NODE_HAS_CHILDREN: 'Node còn module con, hãy archive con trước.',
      NODE_IN_USE: 'Node đang được dùng trong Project Scope hoặc Requirement mapping.',
      SCOPE_NODE_WRONG_ORG: 'Một số module không thuộc tổ chức này. Vui lòng reload.',
      LINK_EXISTS: 'Liên kết giữa hai node này đã tồn tại.',
      FORBIDDEN_BY_POLICY: 'Bạn không có quyền thực hiện hành động này.',
      ACTOR_KEY_EXISTS: 'Mã actor đã tồn tại trong org.',
      REQ_CODE_EXISTS: 'Mã requirement đã tồn tại trong project.',
      TRACE_LINK_EXISTS: 'Trace link trùng (from/to) đã tồn tại.',
    }
    if (conflictMessages[code]) return conflictMessages[code]
  }

  if ((status === 502 || status === 404) && code === 'AI_PROVIDER_ERROR') {
    return 'Lỗi kết nối workflow AI (404). Admin kiểm tra workflow ID và cấu hình OpenAI (project, API key).'
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
