import { ApiError } from '@/shared/lib/api-types'

/** 409 when req↔function link or COVERS trace link already exists — safe to treat as success. */
export function isRequirementLinkConflict(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.status !== 409) return false
  const code = err.problem.code
  // For link-creation mutations, BE may return 409 with/without a problem code.
  // Either way, it's idempotent for our UI (we already check uniqueness client-side).
  if (!code) return true
  return (
    code === 'TRACE_LINK_EXISTS' ||
    code === 'TRACE_LINK_DUPLICATE' ||
    code === 'LINK_EXISTS' ||
    code === 'RESOURCE_CONFLICT' ||
    code === 'ALREADY_EXISTS' ||
    code === 'REQUIREMENT_FUNCTION_DUPLICATE'
  )
}
