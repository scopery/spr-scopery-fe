import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/shared/lib/api-types'
import { PROJECT_CONTROL_ENDPOINTS } from './endpoints'
import type {
  BaselineCompareResponse,
  ChangeImpact,
  ChangeOrder,
  ChangeRequest,
  ChangeRequestItem,
  CreateBaselinePayload,
  CreateChangeOrderPayload,
  CreateChangeRequestItemPayload,
  CreateChangeRequestPayload,
  ProjectBaseline,
  UpdateBaselinePayload,
  UpdateChangeImpactPayload,
  UpdateChangeRequestPayload,
} from '../../domain/model/project-control'

function asList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function listBaselines(projectId: string): Promise<ProjectBaseline[]> {
  const data = await apiClient.get<ProjectBaseline[] | { items: ProjectBaseline[] }>(
    PROJECT_CONTROL_ENDPOINTS.baselines.list(projectId)
  )
  return asList(data)
}

export async function createBaseline(
  projectId: string,
  body: CreateBaselinePayload
): Promise<ProjectBaseline> {
  return apiClient.post<ProjectBaseline>(
    PROJECT_CONTROL_ENDPOINTS.baselines.create(projectId),
    body
  )
}

export async function getCurrentBaseline(
  projectId: string
): Promise<ProjectBaseline | null> {
  try {
    return await apiClient.get<ProjectBaseline>(
      PROJECT_CONTROL_ENDPOINTS.baselines.current(projectId),
      { skipErrorToast: true }
    )
  } catch (err) {
    // No active baseline is a valid empty state (BE returns 404).
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function getBaseline(
  projectId: string,
  baselineId: string
): Promise<ProjectBaseline> {
  return apiClient.get<ProjectBaseline>(
    PROJECT_CONTROL_ENDPOINTS.baselines.get(projectId, baselineId)
  )
}

export async function updateBaseline(
  projectId: string,
  baselineId: string,
  body: UpdateBaselinePayload
): Promise<ProjectBaseline> {
  return apiClient.put<ProjectBaseline>(
    PROJECT_CONTROL_ENDPOINTS.baselines.update(projectId, baselineId),
    body
  )
}

export async function refreshBaselineSnapshot(
  projectId: string,
  baselineId: string
): Promise<ProjectBaseline> {
  return apiClient.post<ProjectBaseline>(
    PROJECT_CONTROL_ENDPOINTS.baselines.refreshSnapshot(projectId, baselineId),
    {}
  )
}

export async function validateBaseline(
  projectId: string,
  baselineId: string
): Promise<ProjectBaseline> {
  return apiClient.post<ProjectBaseline>(
    PROJECT_CONTROL_ENDPOINTS.baselines.validate(projectId, baselineId),
    {}
  )
}

export async function approveBaseline(
  projectId: string,
  baselineId: string
): Promise<ProjectBaseline> {
  return apiClient.post<ProjectBaseline>(
    PROJECT_CONTROL_ENDPOINTS.baselines.approve(projectId, baselineId),
    {}
  )
}

export async function markBaselineCurrent(
  projectId: string,
  baselineId: string
): Promise<ProjectBaseline> {
  return apiClient.post<ProjectBaseline>(
    PROJECT_CONTROL_ENDPOINTS.baselines.markCurrent(projectId, baselineId),
    {}
  )
}

export async function archiveBaseline(
  projectId: string,
  baselineId: string
): Promise<ProjectBaseline> {
  return apiClient.patch<ProjectBaseline>(
    PROJECT_CONTROL_ENDPOINTS.baselines.archive(projectId, baselineId),
    {}
  )
}

export async function compareBaselineToCurrent(
  projectId: string,
  baselineId: string
): Promise<BaselineCompareResponse> {
  return apiClient.get<BaselineCompareResponse>(
    PROJECT_CONTROL_ENDPOINTS.baselines.compareCurrent(projectId, baselineId),
    { skipErrorToast: true }
  )
}

export async function listChangeRequests(projectId: string): Promise<ChangeRequest[]> {
  const data = await apiClient.get<ChangeRequest[] | { items: ChangeRequest[] }>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.list(projectId)
  )
  return asList(data)
}

export async function createChangeRequest(
  projectId: string,
  body: CreateChangeRequestPayload
): Promise<ChangeRequest> {
  return apiClient.post<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.create(projectId),
    body
  )
}

export async function getChangeRequest(
  projectId: string,
  changeRequestId: string
): Promise<ChangeRequest> {
  return apiClient.get<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.get(projectId, changeRequestId)
  )
}

export async function updateChangeRequest(
  projectId: string,
  changeRequestId: string,
  body: UpdateChangeRequestPayload
): Promise<ChangeRequest> {
  return apiClient.put<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.update(projectId, changeRequestId),
    body
  )
}

export async function submitChangeRequest(
  projectId: string,
  changeRequestId: string
): Promise<ChangeRequest> {
  return apiClient.post<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.submit(projectId, changeRequestId),
    {}
  )
}

export async function approveChangeRequest(
  projectId: string,
  changeRequestId: string
): Promise<ChangeRequest> {
  return apiClient.post<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.approve(projectId, changeRequestId),
    {}
  )
}

export async function rejectChangeRequest(
  projectId: string,
  changeRequestId: string,
  reason: string
): Promise<ChangeRequest> {
  return apiClient.post<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.reject(projectId, changeRequestId),
    { reason }
  )
}

export async function cancelChangeRequest(
  projectId: string,
  changeRequestId: string
): Promise<ChangeRequest> {
  return apiClient.post<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.cancel(projectId, changeRequestId),
    {}
  )
}

export async function applyChangeRequest(
  projectId: string,
  changeRequestId: string
): Promise<ChangeRequest> {
  return apiClient.post<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.apply(projectId, changeRequestId),
    {}
  )
}

export async function archiveChangeRequest(
  projectId: string,
  changeRequestId: string
): Promise<ChangeRequest> {
  return apiClient.patch<ChangeRequest>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.archive(projectId, changeRequestId),
    {}
  )
}

export async function listChangeRequestItems(
  projectId: string,
  changeRequestId: string
): Promise<ChangeRequestItem[]> {
  const data = await apiClient.get<ChangeRequestItem[] | { items: ChangeRequestItem[] }>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.items.list(projectId, changeRequestId)
  )
  return asList(data)
}

export async function createChangeRequestItem(
  projectId: string,
  changeRequestId: string,
  body: CreateChangeRequestItemPayload
): Promise<ChangeRequestItem> {
  return apiClient.post<ChangeRequestItem>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.items.create(projectId, changeRequestId),
    body
  )
}

export async function deleteChangeRequestItem(
  projectId: string,
  changeRequestId: string,
  itemId: string
): Promise<void> {
  await apiClient.delete<void>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.items.delete(
      projectId,
      changeRequestId,
      itemId
    ),
    { parseJson: false }
  )
}

export async function getChangeImpact(
  projectId: string,
  changeRequestId: string
): Promise<ChangeImpact | null> {
  try {
    return await apiClient.get<ChangeImpact>(
      PROJECT_CONTROL_ENDPOINTS.changeRequests.impact.get(projectId, changeRequestId)
    )
  } catch {
    return null
  }
}

export async function putChangeImpact(
  projectId: string,
  changeRequestId: string,
  body: UpdateChangeImpactPayload
): Promise<ChangeImpact> {
  return apiClient.put<ChangeImpact>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.impact.put(projectId, changeRequestId),
    body
  )
}

export async function calculateChangeImpact(
  projectId: string,
  changeRequestId: string
): Promise<ChangeImpact> {
  return apiClient.post<ChangeImpact>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.impact.calculate(projectId, changeRequestId),
    {}
  )
}

export async function listChangeOrders(
  projectId: string,
  changeRequestId: string
): Promise<ChangeOrder[]> {
  const data = await apiClient.get<ChangeOrder[] | { items: ChangeOrder[] }>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.changeOrders.list(projectId, changeRequestId)
  )
  return asList(data)
}

export async function createChangeOrder(
  projectId: string,
  changeRequestId: string,
  body: CreateChangeOrderPayload
): Promise<ChangeOrder> {
  return apiClient.post<ChangeOrder>(
    PROJECT_CONTROL_ENDPOINTS.changeRequests.changeOrders.create(
      projectId,
      changeRequestId
    ),
    body
  )
}

export async function approveChangeOrder(
  projectId: string,
  changeOrderId: string
): Promise<ChangeOrder> {
  return apiClient.post<ChangeOrder>(
    PROJECT_CONTROL_ENDPOINTS.changeOrders.approve(projectId, changeOrderId),
    {}
  )
}

export async function rejectChangeOrder(
  projectId: string,
  changeOrderId: string,
  reason: string
): Promise<ChangeOrder> {
  return apiClient.post<ChangeOrder>(
    PROJECT_CONTROL_ENDPOINTS.changeOrders.reject(projectId, changeOrderId),
    { reason }
  )
}
