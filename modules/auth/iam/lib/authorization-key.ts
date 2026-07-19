import type { AuthorizationCheckPayload, AuthorizationCheckResult } from '../model'

/** Stable key for batch result maps: `PERMISSION:ACTION`. */
export function authorizationKey(
  permissionCode: string,
  actionCode: string
): string {
  return `${permissionCode.trim().toUpperCase()}:${actionCode.trim().toUpperCase()}`
}

export function authorizationKeyFromCheck(
  check: Pick<AuthorizationCheckPayload, 'permissionCode' | 'actionCode'>
): string {
  return authorizationKey(check.permissionCode, check.actionCode)
}

export function isAuthorizationAllowed(
  results: AuthorizationCheckResult[] | null | undefined,
  permissionCode: string,
  actionCode: string
): boolean {
  if (!results?.length) return false
  const key = authorizationKey(permissionCode, actionCode)
  return results.some(
    (r) => authorizationKey(r.permissionCode, r.actionCode) === key && r.allowed
  )
}

export function toAuthorizationAllowedMap(
  results: AuthorizationCheckResult[]
): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const r of results) {
    map[authorizationKey(r.permissionCode, r.actionCode)] = r.allowed
  }
  return map
}
