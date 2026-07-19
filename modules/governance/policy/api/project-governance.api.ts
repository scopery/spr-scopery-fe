/**
 * Project governance object APIs — ownership, locks, access grants, pack report.
 */

import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'

export const PROJECT_GOVERNANCE_ENDPOINTS = {
  ownershipList: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/ownership/list`),
  ownership: (projectId: string, objectTypeCode: string, targetId: string) =>
    apiPath(
      `/projects/${projectId}/governance/ownership?objectTypeCode=${encodeURIComponent(objectTypeCode)}&targetId=${encodeURIComponent(targetId)}`),
  assignOwnership: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/ownership/assign`),
  locks: (projectId: string) => apiPath(`/projects/${projectId}/governance/locks`),
  releaseLock: (projectId: string, lockId: string) =>
    apiPath(`/projects/${projectId}/governance/locks/${lockId}/release`),
  finalize: (projectId: string, objectTypeCode: string, targetId: string) =>
    apiPath(
      `/projects/${projectId}/governance/locks/${encodeURIComponent(objectTypeCode)}/${encodeURIComponent(targetId)}/finalize`),
  accessGrants: (projectId: string, objectTypeCode: string, targetId: string) =>
    apiPath(
      `/projects/${projectId}/governance/access-grants?objectTypeCode=${encodeURIComponent(objectTypeCode)}&targetId=${encodeURIComponent(targetId)}`),
  revokeGrant: (projectId: string, grantId: string) =>
    apiPath(`/projects/${projectId}/governance/access-grants/${grantId}/revoke`),
  versions: (projectId: string, objectTypeCode: string, targetId: string) =>
    apiPath(
      `/projects/${projectId}/governance/versions?objectTypeCode=${encodeURIComponent(objectTypeCode)}&targetId=${encodeURIComponent(targetId)}`),
  reportPack: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/reports/pack`),
  lockedObjects: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/reports/locked-objects`),
  ownershipReport: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/reports/ownership`),
  versionHistoryReport: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/reports/version-history`),
  restoreActivityReport: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/reports/restore-activity`),
  snapshot: (projectId: string, snapshotId: string) =>
    apiPath(`/projects/${projectId}/governance/snapshots/${snapshotId}`),
  snapshotDiff: (projectId: string, leftSnapshotId: string, rightSnapshotId: string) =>
    apiPath(
      `/projects/${projectId}/governance/snapshots/diff?leftSnapshotId=${encodeURIComponent(leftSnapshotId)}&rightSnapshotId=${encodeURIComponent(rightSnapshotId)}`),
  restore: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/restore`),
  baselineGuardCheck: (projectId: string) =>
    apiPath(`/projects/${projectId}/governance/baseline-guard/check`),
  objectTypes: () => apiPath('/governance/object-types'),
  objectType: (objectTypeCode: string) =>
    apiPath(`/governance/object-types/${encodeURIComponent(objectTypeCode)}`),
  workspacePolicies: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/governance/policies`),
} as const

export interface GovernanceOwnership {
  id?: string
  objectTypeCode: string
  targetId: string
  ownerTargetType?: string
  ownerTargetId?: string
  ownerDisplayName?: string | null
}

export interface GovernanceLock {
  id: string
  objectTypeCode: string
  targetId: string
  status?: string
  reason?: string | null
}

export interface GovernanceAccessGrant {
  id: string
  objectTypeCode: string
  targetId: string
  granteeType?: string
  granteeId?: string
  grantRole?: string
  status?: string
}

export interface GovernanceVersion {
  id: string
  versionNumber?: number
  createdAt?: string
  label?: string | null
}

export interface GovernancePackSummary {
  ownershipCount?: number
  lockCount?: number
  grantCount?: number
  items?: Array<{
    objectTypeCode: string
    targetId: string
    locked?: boolean
    finalized?: boolean
    ownerDisplayName?: string | null
  }>
}

export async function listProjectOwnership(
  projectId: string
): Promise<{ items: GovernanceOwnership[] }> {
  const res = await apiClient.get<ListPayload<GovernanceOwnership>>(PROJECT_GOVERNANCE_ENDPOINTS.ownershipList(projectId))
  return normalizeItemList(res)
}

export async function listLockedObjects(
  projectId: string
): Promise<{ items: GovernanceLock[] }> {
  const res = await apiClient.get<ListPayload<GovernanceLock>>(PROJECT_GOVERNANCE_ENDPOINTS.lockedObjects(projectId))
  return normalizeItemList(res)
}

export async function getGovernancePack(projectId: string): Promise<GovernancePackSummary> {
  return apiClient.get(PROJECT_GOVERNANCE_ENDPOINTS.reportPack(projectId))
}

export async function listAccessGrants(
  projectId: string,
  objectTypeCode: string,
  targetId: string
): Promise<{ items: GovernanceAccessGrant[] }> {
  const res = await apiClient.get<ListPayload<GovernanceAccessGrant>>(
    PROJECT_GOVERNANCE_ENDPOINTS.accessGrants(projectId, objectTypeCode, targetId)
  )
  return normalizeItemList(res)
}

export async function revokeAccessGrant(projectId: string, grantId: string): Promise<void> {
  await apiClient.post(
    PROJECT_GOVERNANCE_ENDPOINTS.revokeGrant(projectId, grantId),
    undefined,
    { parseJson: false }
  )
}

export async function releaseLock(projectId: string, lockId: string): Promise<void> {
  await apiClient.post(
    PROJECT_GOVERNANCE_ENDPOINTS.releaseLock(projectId, lockId),
    undefined,
    { parseJson: false }
  )
}

export async function finalizeObject(
  projectId: string,
  objectTypeCode: string,
  targetId: string,
  reason: string
): Promise<void> {
  await apiClient.post(
    PROJECT_GOVERNANCE_ENDPOINTS.finalize(projectId, objectTypeCode, targetId),
    { reason },
    { parseJson: false }
  )
}

export async function listGovernanceVersions(
  projectId: string,
  objectTypeCode: string,
  targetId: string
): Promise<{ items: GovernanceVersion[] }> {
  const res = await apiClient.get<ListPayload<GovernanceVersion>>(PROJECT_GOVERNANCE_ENDPOINTS.versions(projectId, objectTypeCode, targetId))
  return normalizeItemList(res)
}

export async function listGovernanceObjectTypes(): Promise<{
  items: Array<{ code: string; name?: string }>
}> {
  const res = await apiClient.get<ListPayload<{ code: string; name?: string }>>(PROJECT_GOVERNANCE_ENDPOINTS.objectTypes())
  return normalizeItemList(res)
}

export async function getGovernanceObjectType(
  objectTypeCode: string
): Promise<{ code: string; name?: string }> {
  return apiClient.get(PROJECT_GOVERNANCE_ENDPOINTS.objectType(objectTypeCode))
}

export async function getGovernanceSnapshot(
  projectId: string,
  snapshotId: string
): Promise<{ id: string; label?: string }> {
  return apiClient.get(PROJECT_GOVERNANCE_ENDPOINTS.snapshot(projectId, snapshotId))
}

export async function checkBaselineGuard(
  projectId: string,
  body?: { objectTypeCode?: string; targetId?: string }
): Promise<{ allowed: boolean; reason?: string }> {
  return apiClient.post(PROJECT_GOVERNANCE_ENDPOINTS.baselineGuardCheck(projectId), body ?? {})
}

export async function restoreGovernance(
  projectId: string,
  body: { snapshotId: string }
): Promise<{ status: string }> {
  return apiClient.post(PROJECT_GOVERNANCE_ENDPOINTS.restore(projectId), body)
}

export async function listWorkspaceGovernancePolicies(
  workspaceId: string
): Promise<{ items: Array<{ id: string; name?: string; status?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; name?: string; status?: string }>>(PROJECT_GOVERNANCE_ENDPOINTS.workspacePolicies(workspaceId))
  return normalizeItemList(res)
}
