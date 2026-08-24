import { PROJECT_ENDPOINTS } from '../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { assertBulkItemCount, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import type {
  CreateRequirementPayload,
  Requirement,
  RequirementsListResponse,
  UpdateRequirementPayload,
} from '../model/requirements'
import {
  normalizeRequirementStatus,
  RequirementStatus,
  type RequirementStatus as RequirementStatusValue,
} from '../model/requirement-status'

export type { Requirement, RequirementType, RequirementsListResponse } from '../model/requirements'

function normalizeRequirement(raw: Requirement): Requirement {
  const anyRaw = raw as Requirement & Record<string, unknown>
  const description =
    (typeof anyRaw.description === 'string' ? anyRaw.description : null) ??
    (typeof anyRaw.Description === 'string' ? anyRaw.Description : null) ??
    null
  const priority =
    (typeof anyRaw.priority === 'string' ? anyRaw.priority : null) ??
    (typeof anyRaw.Priority === 'string' ? anyRaw.Priority : null) ??
    null
  const statusRaw =
    (typeof anyRaw.status === 'string' ? anyRaw.status : null) ??
    (typeof anyRaw.Status === 'string' ? anyRaw.Status : null) ??
    raw.status ??
    null
  return {
    ...raw,
    description: description ?? raw.description ?? null,
    priority: priority ?? raw.priority ?? null,
    status: statusRaw ? normalizeRequirementStatus(statusRaw) : raw.status ?? RequirementStatus.Draft,
  }
}

export async function listRequirements(
  orgId: string,
  projectId: string,
  params?: { limit?: number; offset?: number; includeArchived?: boolean; sort?: string }
): Promise<RequirementsListResponse> {
  const includeArchived = params?.includeArchived === true
  const url = PROJECT_ENDPOINTS.requirements(orgId, projectId, {
    includeArchived,
    limit: params?.limit,
    offset: params?.offset,
    sort: params?.sort,
  })
  const res = await apiClient.get<RequirementsListResponse | Requirement[]>(url)
  const items = (Array.isArray(res) ? res : (res.items ?? []))
    .map(normalizeRequirement)
    // Active register by default — Archived tab loads with includeArchived.
    .filter((r) => includeArchived || (r.status ?? '').toUpperCase() !== 'ARCHIVED')
  if (Array.isArray(res)) {
    return { items }
  }
  return { ...res, items }
}

export async function getRequirement(
  orgId: string,
  projectId: string,
  requirementId: string
): Promise<Requirement> {
  const res = await apiClient.get<Requirement>(
    PROJECT_ENDPOINTS.requirement(orgId, projectId, requirementId)
  )
  return normalizeRequirement(res)
}

export async function createRequirement(
  orgId: string,
  projectId: string,
  body: CreateRequirementPayload
): Promise<Requirement> {
  return apiClient.post<Requirement>(PROJECT_ENDPOINTS.requirements(orgId, projectId), body)
}

/** Async bulk — returns job immediately; caller polls via useBulkJobPoller. */
export async function submitRequirementsBulk(
  orgId: string,
  projectId: string,
  items: CreateRequirementPayload[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(PROJECT_ENDPOINTS.requirementsBulk(orgId, projectId), { items }, { skipGlobalLoading: true })
}

export async function updateRequirement(
  orgId: string,
  projectId: string,
  requirementId: string,
  body: UpdateRequirementPayload
): Promise<Requirement> {
  return apiClient.patch<Requirement>(
    PROJECT_ENDPOINTS.requirement(orgId, projectId, requirementId),
    body
  )
}

/**
 * Soft-delete via WAVE4 archive endpoint.
 * Hard DELETE is not supported by BE (`PATCH .../requirements/{id}/archive`).
 */
export async function archiveRequirement(
  orgId: string,
  projectId: string,
  requirementId: string
): Promise<void> {
  await apiClient.patch<void>(
    PROJECT_ENDPOINTS.requirementArchive(orgId, projectId, requirementId),
    undefined,
    { parseJson: false }
  )
}

/** Lifecycle transitions — status is not edited via generic PATCH body. */
export async function transitionRequirementStatus(
  orgId: string,
  projectId: string,
  requirementId: string,
  status: RequirementStatusValue
): Promise<Requirement | void> {
  const next = normalizeRequirementStatus(status)
  switch (next) {
    case RequirementStatus.Approved:
      return apiClient.post<Requirement>(
        PROJECT_ENDPOINTS.requirementApprove(orgId, projectId, requirementId)
      )
    case RequirementStatus.Rejected:
      return apiClient.patch<Requirement>(
        PROJECT_ENDPOINTS.requirementReject(orgId, projectId, requirementId)
      )
    case RequirementStatus.Deferred:
      return apiClient.patch<Requirement>(
        PROJECT_ENDPOINTS.requirementDefer(orgId, projectId, requirementId)
      )
    case RequirementStatus.Implemented:
      return apiClient.patch<Requirement>(
        PROJECT_ENDPOINTS.requirementImplement(orgId, projectId, requirementId)
      )
    case RequirementStatus.Archived:
      await archiveRequirement(orgId, projectId, requirementId)
      return
    case RequirementStatus.Draft:
      throw new Error('Returning a requirement to Draft is not supported by the API')
    default:
      throw new Error(`Unsupported requirement status: ${status}`)
  }
}
