import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type {
  AuthorizationCheckBatchPayload,
  AuthorizationCheckByRightPayload,
  AuthorizationCheckByRightResult,
  AuthorizationCheckPayload,
  AuthorizationCheckResult,
} from '../model'

function normalizeCheckPayload(body: AuthorizationCheckPayload): AuthorizationCheckPayload {
  const payload: AuthorizationCheckPayload = {
    permissionCode: body.permissionCode.trim().toUpperCase(),
    actionCode: body.actionCode.trim().toUpperCase(),
    resourceType: body.resourceType.trim().toUpperCase(),
  }
  if (
    body.resourceRefId != null &&
    body.resourceRefId !== '' &&
    payload.resourceType !== 'GLOBAL'
  ) {
    payload.resourceRefId = body.resourceRefId
  }
  return payload
}

export async function checkAuthorization(
  body: AuthorizationCheckPayload
): Promise<AuthorizationCheckResult> {
  return apiClient.post<AuthorizationCheckResult>(
    IAM_ENDPOINTS.authorization.check(),
    normalizeCheckPayload(body)
  )
}

export async function checkAuthorizationBatch(
  body: AuthorizationCheckBatchPayload
): Promise<AuthorizationCheckResult[]> {
  return apiClient.post<AuthorizationCheckResult[]>(IAM_ENDPOINTS.authorization.checkBatch(), {
    checks: body.checks.map(normalizeCheckPayload),
  })
}

export async function explainAuthorization(
  body: AuthorizationCheckPayload
): Promise<AuthorizationCheckResult> {
  const payload = normalizeCheckPayload(body)
  return apiClient.get<AuthorizationCheckResult>(
    IAM_ENDPOINTS.authorization.explain({
      permissionCode: payload.permissionCode,
      actionCode: payload.actionCode,
      resourceType: payload.resourceType,
      resourceRefId: payload.resourceRefId ?? undefined,
    })
  )
}

/** Legacy debug: check by right code on an IAM resource id. */
export async function checkAuthorizationByRight(
  body: AuthorizationCheckByRightPayload
): Promise<AuthorizationCheckByRightResult> {
  return apiClient.post<AuthorizationCheckByRightResult>(
    IAM_ENDPOINTS.authorization.checkByRight(),
    body
  )
}
