/**
 * RFC 9457 Problem Details (application/problem+json)
 * Used when API returns error response.
 */
export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  request_id?: string
  code?: string
  errors?: Array<{ path: string; message: string }>
  action_key?: string
  blocked_reasons?: string[]
  suggested_actions?: string[]
  warnings?: string[]
  matched_policy_ids?: string[]
  matched_rule_ids?: string[]
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetails
  ) {
    super(problem.detail || problem.title || `Request failed (${status})`)
    this.name = 'ApiError'
  }

  get isAuthError(): boolean {
    return this.status === 401 || /token|expired|unauthorized/i.test(this.problem.detail || '')
  }

  get isValidationError(): boolean {
    return this.status === 422 && Array.isArray(this.problem.errors)
  }
}

/** Check if error is RFC 9457 Problem Details (ApiError) */
export function isProblem(err: unknown): err is ApiError {
  return err instanceof ApiError
}

/** Get problem code from error (for conflict/409 handling) */
export function getProblemCode(err: unknown): string | undefined {
  return isProblem(err) ? err.problem.code : undefined
}

/** Alias for spec: check if error is RFC 9457 Problem Details (ApiError). */
export const isProblemDetails = isProblem

/** Alias for spec: get error code for UI mapping (409/422/413/429/502…). */
export const getErrorCode = getProblemCode

/** Get request_id from problem details (for error modal debug). */
export function getProblemRequestId(err: unknown): string | undefined {
  return isProblem(err) ? err.problem.request_id : undefined
}

/**
 * Normalize any error to a stable shape for UI. FE branches on code first; 409 always has code (per API doc).
 */
export function normalizeProblem(err: unknown): {
  status: number
  code: string | undefined
  detail: string
} {
  if (err instanceof ApiError) {
    return {
      status: err.status,
      code: err.problem.code,
      detail: err.problem.detail || err.problem.title || `Request failed (${err.status})`,
    }
  }
  const message = err instanceof Error ? err.message : 'Something went wrong'
  return { status: 0, code: undefined, detail: message }
}
