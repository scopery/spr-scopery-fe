import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { type BulkJobResponse, assertBulkItemCount } from '@/shared/lib/bulkJobs'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import type {
  AddFunctionalItemAnchorBody,
  BusinessRule,
  CreateBusinessRuleBody,
  CreateFunctionalItemBody,
  CreateNonFunctionalItemBody,
  FunctionalItem,
  FunctionalItemAnchor,
  NonFunctionalItem,
  UpdateBusinessRuleBody,
  UpdateFunctionalItemBody,
  UpdateNonFunctionalItemBody,
} from '../model/functional-catalog'
import type {
  FunctionApiLink,
  FunctionCommunicationLink,
  FunctionScreenLink,
  LinkFunctionApiBody,
  LinkFunctionCommunicationBody,
  LinkFunctionScreenBody,
  LinkNfrScopeTargetBody,
  NfrScopeTarget,
} from '../model/overall-structure'
import type {
  FunctionalItemImportExecuteRequest,
  FunctionalItemImportExecuteResult,
  FunctionalItemImportPreviewRequest,
  FunctionalItemImportPreviewResponse,
} from '../model/functional-item-import'

export const FUNCTIONAL_CATALOG_ENDPOINTS = {
  functionalItems: (projectId: string) =>
    apiPath(`/projects/${projectId}/functional-items`),
  functionalItemsBulk: (projectId: string) =>
    apiPath(`/projects/${projectId}/functional-items/bulk`),
  functionalItem: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/functional-items/${id}`),
  functionalItemsImportPreview: (projectId: string) =>
    apiPath(`/projects/${projectId}/functional-items/import/preview`),
  functionalItemsImportExecute: (projectId: string) =>
    apiPath(`/projects/${projectId}/functional-items/import/execute`),
  businessRules: (projectId: string, functionalItemId: string) =>
    apiPath(`/projects/${projectId}/functional-items/${functionalItemId}/business-rules`),
  businessRule: (projectId: string, functionalItemId: string, id: string) =>
    apiPath(
      `/projects/${projectId}/functional-items/${functionalItemId}/business-rules/${id}`
    ),
  anchors: (projectId: string, functionalItemId: string) =>
    apiPath(`/projects/${projectId}/functional-items/${functionalItemId}/anchors`),
  anchor: (projectId: string, functionalItemId: string, id: string) =>
    apiPath(`/projects/${projectId}/functional-items/${functionalItemId}/anchors/${id}`),
  functionalItemAnchors: (projectId: string) =>
    apiPath(`/projects/${projectId}/functional-item-anchors`),
  nonFunctionalItems: (projectId: string) =>
    apiPath(`/projects/${projectId}/non-functional-items`),
  nonFunctionalItemsBulk: (projectId: string) =>
    apiPath(`/projects/${projectId}/non-functional-items/bulk`),
  nonFunctionalItem: (projectId: string, id: string) =>
    apiPath(`/projects/${projectId}/non-functional-items/${id}`),
  functionScreens: (projectId: string, functionalItemId: string) =>
    apiPath(`/projects/${projectId}/functional-items/${functionalItemId}/screens`),
  functionScreen: (projectId: string, functionalItemId: string, screenId: string) =>
    apiPath(
      `/projects/${projectId}/functional-items/${functionalItemId}/screens/${screenId}`
    ),
  functionApiEndpoints: (projectId: string, functionalItemId: string) =>
    apiPath(`/projects/${projectId}/functional-items/${functionalItemId}/api-endpoints`),
  functionApiEndpoint: (
    projectId: string,
    functionalItemId: string,
    apiEndpointId: string
  ) =>
    apiPath(
      `/projects/${projectId}/functional-items/${functionalItemId}/api-endpoints/${apiEndpointId}`
    ),
  functionCommunications: (projectId: string, functionalItemId: string) =>
    apiPath(`/projects/${projectId}/functional-items/${functionalItemId}/communications`),
  functionCommunication: (
    projectId: string,
    functionalItemId: string,
    communicationId: string
  ) =>
    apiPath(
      `/projects/${projectId}/functional-items/${functionalItemId}/communications/${communicationId}`
    ),
  nfrScopeTargets: (projectId: string, nfrId: string) =>
    apiPath(`/projects/${projectId}/non-functional-items/${nfrId}/scope-targets`),
  nfrScopeTarget: (projectId: string, nfrId: string, targetId: string) =>
    apiPath(
      `/projects/${projectId}/non-functional-items/${nfrId}/scope-targets/${targetId}`
    ),
} as const

export async function listFunctionalItems(
  projectId: string,
  params?: { moduleId?: string }
): Promise<{ items: FunctionalItem[] }> {
  const q = new URLSearchParams()
  if (params?.moduleId) q.set('moduleId', params.moduleId)
  const qs = q.toString()
  const res = await apiClient.get<ListPayload<FunctionalItem>>(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionalItems(projectId) + (qs ? `?${qs}` : '')
  )
  return normalizeItemList(res)
}

export async function getFunctionalItem(
  projectId: string,
  id: string
): Promise<FunctionalItem> {
  return apiClient.get(FUNCTIONAL_CATALOG_ENDPOINTS.functionalItem(projectId, id))
}

export async function createFunctionalItem(
  projectId: string,
  body: CreateFunctionalItemBody
): Promise<FunctionalItem> {
  return apiClient.post(FUNCTIONAL_CATALOG_ENDPOINTS.functionalItems(projectId), body)
}

export async function submitFunctionalItemsBulk(
  projectId: string,
  items: CreateFunctionalItemBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(FUNCTIONAL_CATALOG_ENDPOINTS.functionalItemsBulk(projectId), { items }, { skipGlobalLoading: true })
}

export async function updateFunctionalItem(
  projectId: string,
  id: string,
  body: UpdateFunctionalItemBody
): Promise<FunctionalItem> {
  return apiClient.put(FUNCTIONAL_CATALOG_ENDPOINTS.functionalItem(projectId, id), body)
}

export async function deleteFunctionalItem(projectId: string, id: string): Promise<void> {
  await apiClient.delete(FUNCTIONAL_CATALOG_ENDPOINTS.functionalItem(projectId, id))
}

export async function listNonFunctionalItems(
  projectId: string,
  params?: { targetId?: string }
): Promise<{ items: NonFunctionalItem[] }> {
  const q = new URLSearchParams()
  if (params?.targetId) q.set('targetId', params.targetId)
  const qs = q.toString()
  const res = await apiClient.get<ListPayload<NonFunctionalItem>>(
    FUNCTIONAL_CATALOG_ENDPOINTS.nonFunctionalItems(projectId) + (qs ? `?${qs}` : '')
  )
  return normalizeItemList(res)
}

export async function getNonFunctionalItem(
  projectId: string,
  id: string
): Promise<NonFunctionalItem> {
  return apiClient.get(FUNCTIONAL_CATALOG_ENDPOINTS.nonFunctionalItem(projectId, id))
}

export async function createNonFunctionalItem(
  projectId: string,
  body: CreateNonFunctionalItemBody
): Promise<NonFunctionalItem> {
  return apiClient.post(FUNCTIONAL_CATALOG_ENDPOINTS.nonFunctionalItems(projectId), body)
}

export async function submitNonFunctionalItemsBulk(
  projectId: string,
  items: CreateNonFunctionalItemBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(FUNCTIONAL_CATALOG_ENDPOINTS.nonFunctionalItemsBulk(projectId), { items }, { skipGlobalLoading: true })
}

export async function updateNonFunctionalItem(
  projectId: string,
  id: string,
  body: UpdateNonFunctionalItemBody
): Promise<NonFunctionalItem> {
  return apiClient.put(FUNCTIONAL_CATALOG_ENDPOINTS.nonFunctionalItem(projectId, id), body)
}

export async function deleteNonFunctionalItem(projectId: string, id: string): Promise<void> {
  await apiClient.delete(FUNCTIONAL_CATALOG_ENDPOINTS.nonFunctionalItem(projectId, id))
}

export async function listBusinessRules(
  projectId: string,
  functionalItemId: string
): Promise<{ items: BusinessRule[] }> {
  const res = await apiClient.get<ListPayload<BusinessRule>>(
    FUNCTIONAL_CATALOG_ENDPOINTS.businessRules(projectId, functionalItemId)
  )
  return normalizeItemList(res)
}

export async function createBusinessRule(
  projectId: string,
  functionalItemId: string,
  body: CreateBusinessRuleBody
): Promise<BusinessRule> {
  return apiClient.post(
    FUNCTIONAL_CATALOG_ENDPOINTS.businessRules(projectId, functionalItemId),
    body
  )
}

export async function updateBusinessRule(
  projectId: string,
  functionalItemId: string,
  id: string,
  body: UpdateBusinessRuleBody
): Promise<BusinessRule> {
  return apiClient.put(
    FUNCTIONAL_CATALOG_ENDPOINTS.businessRule(projectId, functionalItemId, id),
    body
  )
}

export async function deleteBusinessRule(
  projectId: string,
  functionalItemId: string,
  id: string
): Promise<void> {
  await apiClient.delete(
    FUNCTIONAL_CATALOG_ENDPOINTS.businessRule(projectId, functionalItemId, id)
  )
}

export async function listAnchors(
  projectId: string,
  functionalItemId: string
): Promise<{ items: FunctionalItemAnchor[] }> {
  const res = await apiClient.get<ListPayload<FunctionalItemAnchor>>(
    FUNCTIONAL_CATALOG_ENDPOINTS.anchors(projectId, functionalItemId)
  )
  return normalizeItemList(res)
}

export async function addAnchor(
  projectId: string,
  functionalItemId: string,
  body: AddFunctionalItemAnchorBody
): Promise<FunctionalItemAnchor> {
  return apiClient.post(
    FUNCTIONAL_CATALOG_ENDPOINTS.anchors(projectId, functionalItemId),
    body
  )
}

export async function removeAnchor(
  projectId: string,
  functionalItemId: string,
  id: string
): Promise<void> {
  await apiClient.delete(FUNCTIONAL_CATALOG_ENDPOINTS.anchor(projectId, functionalItemId, id))
}

/** Bulk / reverse index of FR anchors for a project (1 round-trip). */
export async function listFunctionalItemAnchors(
  projectId: string,
  params?: { nodeType?: string; nodeId?: string }
): Promise<{ items: FunctionalItemAnchor[] }> {
  const q = new URLSearchParams()
  if (params?.nodeType) q.set('nodeType', params.nodeType)
  if (params?.nodeId) q.set('nodeId', params.nodeId)
  const qs = q.toString()
  const url =
    FUNCTIONAL_CATALOG_ENDPOINTS.functionalItemAnchors(projectId) + (qs ? `?${qs}` : '')
  const res = await apiClient.get<ListPayload<FunctionalItemAnchor>>(url)
  return normalizeItemList(res)
}

export async function listFunctionScreens(
  projectId: string,
  functionalItemId: string
): Promise<{ items: FunctionScreenLink[] }> {
  const res = await apiClient.get<ListPayload<FunctionScreenLink>>(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionScreens(projectId, functionalItemId)
  )
  return normalizeItemList(res)
}

export async function linkFunctionScreen(
  projectId: string,
  functionalItemId: string,
  body: LinkFunctionScreenBody
): Promise<FunctionScreenLink> {
  return apiClient.post(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionScreens(projectId, functionalItemId),
    body
  )
}

export async function unlinkFunctionScreen(
  projectId: string,
  functionalItemId: string,
  screenId: string
): Promise<void> {
  await apiClient.delete(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionScreen(projectId, functionalItemId, screenId)
  )
}

export async function listFunctionApiEndpoints(
  projectId: string,
  functionalItemId: string
): Promise<{ items: FunctionApiLink[] }> {
  const res = await apiClient.get<ListPayload<FunctionApiLink>>(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionApiEndpoints(projectId, functionalItemId)
  )
  return normalizeItemList(res)
}

export async function linkFunctionApiEndpoint(
  projectId: string,
  functionalItemId: string,
  body: LinkFunctionApiBody
): Promise<FunctionApiLink> {
  return apiClient.post(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionApiEndpoints(projectId, functionalItemId),
    body
  )
}

export async function unlinkFunctionApiEndpoint(
  projectId: string,
  functionalItemId: string,
  apiEndpointId: string
): Promise<void> {
  await apiClient.delete(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionApiEndpoint(
      projectId,
      functionalItemId,
      apiEndpointId
    )
  )
}

export async function listFunctionCommunications(
  projectId: string,
  functionalItemId: string
): Promise<{ items: FunctionCommunicationLink[] }> {
  const res = await apiClient.get<ListPayload<FunctionCommunicationLink>>(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionCommunications(projectId, functionalItemId)
  )
  return normalizeItemList(res)
}

export async function linkFunctionCommunication(
  projectId: string,
  functionalItemId: string,
  body: LinkFunctionCommunicationBody
): Promise<FunctionCommunicationLink> {
  return apiClient.post(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionCommunications(projectId, functionalItemId),
    body
  )
}

export async function unlinkFunctionCommunication(
  projectId: string,
  functionalItemId: string,
  communicationId: string
): Promise<void> {
  await apiClient.delete(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionCommunication(
      projectId,
      functionalItemId,
      communicationId
    )
  )
}

export async function listNfrScopeTargets(
  projectId: string,
  nfrId: string
): Promise<{ items: NfrScopeTarget[] }> {
  const res = await apiClient.get<ListPayload<NfrScopeTarget>>(
    FUNCTIONAL_CATALOG_ENDPOINTS.nfrScopeTargets(projectId, nfrId)
  )
  return normalizeItemList(res)
}

export async function linkNfrScopeTarget(
  projectId: string,
  nfrId: string,
  body: LinkNfrScopeTargetBody
): Promise<NfrScopeTarget> {
  return apiClient.post(
    FUNCTIONAL_CATALOG_ENDPOINTS.nfrScopeTargets(projectId, nfrId),
    body
  )
}

export async function unlinkNfrScopeTarget(
  projectId: string,
  nfrId: string,
  targetId: string
): Promise<void> {
  await apiClient.delete(
    FUNCTIONAL_CATALOG_ENDPOINTS.nfrScopeTarget(projectId, nfrId, targetId)
  )
}

export async function previewFunctionalItemsImport(
  projectId: string,
  body: FunctionalItemImportPreviewRequest
): Promise<FunctionalItemImportPreviewResponse> {
  return apiClient.post<FunctionalItemImportPreviewResponse>(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionalItemsImportPreview(projectId),
    body
  )
}

export async function executeFunctionalItemsImport(
  projectId: string,
  body: FunctionalItemImportExecuteRequest
): Promise<FunctionalItemImportExecuteResult> {
  return apiClient.post<FunctionalItemImportExecuteResult>(
    FUNCTIONAL_CATALOG_ENDPOINTS.functionalItemsImportExecute(projectId),
    body
  )
}
