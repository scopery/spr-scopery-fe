import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { assertBulkItemCount, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import type {
  PrimaryFunctionChangeImpact,
  UseCaseFlowScope,
  UseCaseMentionOptionsResponse,
} from '../model/flow-mention'
import type {
  AddFlowStepBody,
  AddSupportingFunctionBody,
  AddUseCaseAcceptanceCriterionBody,
  AddUseCaseBusinessRuleBody,
  AddUseCaseConditionBody,
  CreateUseCaseBody,
  BulkCreateUseCaseItem,
  CreateUseCaseFlowBody,
  LinkRequirementBody,
  ReorderFlowStepsBody,
  UpdateFlowStepBody,
  UpdateUseCaseAcceptanceCriterionBody,
  UpdateUseCaseBody,
  UpdateUseCaseBusinessRuleBody,
  UpdateUseCaseConditionBody,
  UpdateUseCaseFlowBody,
  UseCase,
  UseCaseAcceptanceCriterion,
  UseCaseBusinessRule,
  UseCaseCondition,
  UseCaseDetail,
  UseCaseFlow,
  UseCaseFlowStep,
} from '../model/use-case'

export const USE_CASE_ENDPOINTS = {
  list: (pId: string) => apiPath(`/projects/${pId}/use-cases`),
  bulk: (pId: string) => apiPath(`/projects/${pId}/use-cases/bulk`),
  detail: (pId: string, ucId: string) => apiPath(`/projects/${pId}/use-cases/${ucId}`),
  nestedImport: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/nested-import`),
  byFunction: (pId: string, fId: string) =>
    apiPath(`/projects/${pId}/functional-items/${fId}/use-cases`),
  supportingFns: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/supporting-functions`),
  supportingFn: (pId: string, ucId: string, fId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/supporting-functions/${fId}`),
  flows: (pId: string, ucId: string) => apiPath(`/projects/${pId}/use-cases/${ucId}/flows`),
  flow: (pId: string, ucId: string, fId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/flows/${fId}`),
  steps: (pId: string, ucId: string, fId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/flows/${fId}/steps`),
  stepsOrder: (pId: string, ucId: string, fId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/flows/${fId}/steps/order`),
  step: (pId: string, ucId: string, fId: string, sId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/flows/${fId}/steps/${sId}`),
  conditions: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/conditions`),
  condition: (pId: string, ucId: string, cId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/conditions/${cId}`),
  businessRules: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/business-rules`),
  businessRule: (pId: string, ucId: string, rId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/business-rules/${rId}`),
  criteria: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/acceptance-criteria`),
  criterion: (pId: string, ucId: string, cId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/acceptance-criteria/${cId}`),
  ucRequirements: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/requirements`),
  ucRequirement: (pId: string, ucId: string, rId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/requirements/${rId}`),
  fnRequirements: (pId: string, fId: string) =>
    apiPath(`/projects/${pId}/functional-items/${fId}/requirements`),
  fnRequirement: (pId: string, fId: string, rId: string) =>
    apiPath(`/projects/${pId}/functional-items/${fId}/requirements/${rId}`),
  fnRequirementsBulkLink: (pId: string, fId: string) =>
    apiPath(`/projects/${pId}/functional-items/${fId}/requirements/bulk-link`),
  flowScope: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/flow-scope`),
  mentionOptions: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/mention-options`),
  primaryFunctionChangeImpact: (pId: string, ucId: string) =>
    apiPath(`/projects/${pId}/use-cases/${ucId}/primary-function-change-impact`),
} as const

export async function listUseCases(projectId: string): Promise<UseCase[]> {
  return apiClient.get<UseCase[]>(USE_CASE_ENDPOINTS.list(projectId))
}

export async function createUseCase(
  projectId: string,
  body: CreateUseCaseBody
): Promise<UseCaseDetail> {
  return apiClient.post<UseCaseDetail>(USE_CASE_ENDPOINTS.list(projectId), body)
}

export async function submitUseCasesBulk(
  projectId: string,
  items: BulkCreateUseCaseItem[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(USE_CASE_ENDPOINTS.bulk(projectId), { items }, { skipGlobalLoading: true })
}

export async function getUseCaseDetail(
  projectId: string,
  useCaseId: string
): Promise<UseCaseDetail> {
  return apiClient.get<UseCaseDetail>(USE_CASE_ENDPOINTS.detail(projectId, useCaseId))
}

/** One-shot nested import for an existing Use Case — BE applies all parts. */
export async function importUseCaseNested(
  projectId: string,
  useCaseId: string,
  body: {
    flows?: BulkCreateUseCaseItem['flows']
    conditions?: BulkCreateUseCaseItem['conditions']
    businessRules?: BulkCreateUseCaseItem['businessRules']
    acceptanceCriteria?: BulkCreateUseCaseItem['acceptanceCriteria']
    supportingFunctionIds?: string[]
  }
): Promise<{ useCaseId: string; createdParts: number }> {
  return apiClient.post(USE_CASE_ENDPOINTS.nestedImport(projectId, useCaseId), body)
}

export async function updateUseCase(
  projectId: string,
  useCaseId: string,
  body: UpdateUseCaseBody
): Promise<UseCase> {
  return apiClient.put<UseCase>(USE_CASE_ENDPOINTS.detail(projectId, useCaseId), body)
}

export async function deleteUseCase(projectId: string, useCaseId: string): Promise<void> {
  await apiClient.delete(USE_CASE_ENDPOINTS.detail(projectId, useCaseId))
}

export async function listUseCasesByFunction(
  projectId: string,
  functionId: string
): Promise<UseCase[]> {
  return apiClient.get<UseCase[]>(USE_CASE_ENDPOINTS.byFunction(projectId, functionId))
}

export async function addSupportingFunction(
  projectId: string,
  useCaseId: string,
  body: AddSupportingFunctionBody
): Promise<void> {
  await apiClient.post(USE_CASE_ENDPOINTS.supportingFns(projectId, useCaseId), body)
}

export async function removeSupportingFunction(
  projectId: string,
  useCaseId: string,
  functionId: string
): Promise<void> {
  await apiClient.delete(USE_CASE_ENDPOINTS.supportingFn(projectId, useCaseId, functionId))
}

export async function createUseCaseFlow(
  projectId: string,
  useCaseId: string,
  body: CreateUseCaseFlowBody
): Promise<UseCaseFlow> {
  return apiClient.post<UseCaseFlow>(USE_CASE_ENDPOINTS.flows(projectId, useCaseId), body)
}

export async function updateUseCaseFlow(
  projectId: string,
  useCaseId: string,
  flowId: string,
  body: UpdateUseCaseFlowBody
): Promise<UseCaseFlow> {
  return apiClient.put<UseCaseFlow>(
    USE_CASE_ENDPOINTS.flow(projectId, useCaseId, flowId),
    body
  )
}

export async function deleteUseCaseFlow(
  projectId: string,
  useCaseId: string,
  flowId: string
): Promise<void> {
  await apiClient.delete(USE_CASE_ENDPOINTS.flow(projectId, useCaseId, flowId))
}

export async function addFlowStep(
  projectId: string,
  useCaseId: string,
  flowId: string,
  body: AddFlowStepBody
): Promise<UseCaseFlowStep> {
  return apiClient.post<UseCaseFlowStep>(
    USE_CASE_ENDPOINTS.steps(projectId, useCaseId, flowId),
    body
  )
}

export async function updateFlowStep(
  projectId: string,
  useCaseId: string,
  flowId: string,
  stepId: string,
  body: UpdateFlowStepBody
): Promise<UseCaseFlowStep> {
  return apiClient.put<UseCaseFlowStep>(
    USE_CASE_ENDPOINTS.step(projectId, useCaseId, flowId, stepId),
    body
  )
}

export async function deleteFlowStep(
  projectId: string,
  useCaseId: string,
  flowId: string,
  stepId: string
): Promise<void> {
  await apiClient.delete(USE_CASE_ENDPOINTS.step(projectId, useCaseId, flowId, stepId))
}

export async function reorderFlowSteps(
  projectId: string,
  useCaseId: string,
  flowId: string,
  body: ReorderFlowStepsBody
): Promise<UseCaseFlowStep[]> {
  return apiClient.put<UseCaseFlowStep[]>(
    USE_CASE_ENDPOINTS.stepsOrder(projectId, useCaseId, flowId),
    body
  )
}

export async function addUseCaseCondition(
  projectId: string,
  useCaseId: string,
  body: AddUseCaseConditionBody
): Promise<UseCaseCondition> {
  return apiClient.post<UseCaseCondition>(
    USE_CASE_ENDPOINTS.conditions(projectId, useCaseId),
    body
  )
}

export async function updateUseCaseCondition(
  projectId: string,
  useCaseId: string,
  conditionId: string,
  body: UpdateUseCaseConditionBody
): Promise<UseCaseCondition> {
  return apiClient.put<UseCaseCondition>(
    USE_CASE_ENDPOINTS.condition(projectId, useCaseId, conditionId),
    body
  )
}

export async function deleteUseCaseCondition(
  projectId: string,
  useCaseId: string,
  conditionId: string
): Promise<void> {
  await apiClient.delete(USE_CASE_ENDPOINTS.condition(projectId, useCaseId, conditionId))
}

export async function addUseCaseBusinessRule(
  projectId: string,
  useCaseId: string,
  body: AddUseCaseBusinessRuleBody
): Promise<UseCaseBusinessRule> {
  return apiClient.post<UseCaseBusinessRule>(
    USE_CASE_ENDPOINTS.businessRules(projectId, useCaseId),
    body
  )
}

export async function updateUseCaseBusinessRule(
  projectId: string,
  useCaseId: string,
  ruleId: string,
  body: UpdateUseCaseBusinessRuleBody
): Promise<UseCaseBusinessRule> {
  return apiClient.put<UseCaseBusinessRule>(
    USE_CASE_ENDPOINTS.businessRule(projectId, useCaseId, ruleId),
    body
  )
}

export async function deleteUseCaseBusinessRule(
  projectId: string,
  useCaseId: string,
  ruleId: string
): Promise<void> {
  await apiClient.delete(USE_CASE_ENDPOINTS.businessRule(projectId, useCaseId, ruleId))
}

export async function addUseCaseAcceptanceCriterion(
  projectId: string,
  useCaseId: string,
  body: AddUseCaseAcceptanceCriterionBody
): Promise<UseCaseAcceptanceCriterion> {
  return apiClient.post<UseCaseAcceptanceCriterion>(
    USE_CASE_ENDPOINTS.criteria(projectId, useCaseId),
    body
  )
}

export async function updateUseCaseAcceptanceCriterion(
  projectId: string,
  useCaseId: string,
  criterionId: string,
  body: UpdateUseCaseAcceptanceCriterionBody
): Promise<UseCaseAcceptanceCriterion> {
  return apiClient.put<UseCaseAcceptanceCriterion>(
    USE_CASE_ENDPOINTS.criterion(projectId, useCaseId, criterionId),
    body
  )
}

export async function deleteUseCaseAcceptanceCriterion(
  projectId: string,
  useCaseId: string,
  criterionId: string
): Promise<void> {
  await apiClient.delete(USE_CASE_ENDPOINTS.criterion(projectId, useCaseId, criterionId))
}

export async function getUseCaseRequirements(
  projectId: string,
  useCaseId: string
): Promise<string[]> {
  return apiClient.get<string[]>(USE_CASE_ENDPOINTS.ucRequirements(projectId, useCaseId))
}

export async function linkRequirementToUseCase(
  projectId: string,
  useCaseId: string,
  body: LinkRequirementBody
): Promise<void> {
  await apiClient.post(USE_CASE_ENDPOINTS.ucRequirements(projectId, useCaseId), body)
}

export async function unlinkRequirementFromUseCase(
  projectId: string,
  useCaseId: string,
  requirementId: string
): Promise<void> {
  await apiClient.delete(
    USE_CASE_ENDPOINTS.ucRequirement(projectId, useCaseId, requirementId)
  )
}

export async function getFunctionRequirements(
  projectId: string,
  functionId: string
): Promise<string[]> {
  return apiClient.get<string[]>(USE_CASE_ENDPOINTS.fnRequirements(projectId, functionId))
}

export async function linkRequirementToFunction(
  projectId: string,
  functionId: string,
  body: LinkRequirementBody,
  init?: { skipErrorToast?: boolean }
): Promise<void> {
  // BE: idempotent 200 even when already linked (no 409).
  await apiClient.post(USE_CASE_ENDPOINTS.fnRequirements(projectId, functionId), body, init)
}

/** Async bulk link requirements → one function (max 20). Poll GET /api/bulk-jobs/{jobId}. */
export async function bulkLinkRequirementsToFunction(
  projectId: string,
  functionId: string,
  requirementIds: string[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(requirementIds.length)
  return apiClient.post<BulkJobResponse>(
    USE_CASE_ENDPOINTS.fnRequirementsBulkLink(projectId, functionId),
    { requirementIds },
    { skipGlobalLoading: true }
  )
}

export async function unlinkRequirementFromFunction(
  projectId: string,
  functionId: string,
  requirementId: string
): Promise<void> {
  await apiClient.delete(
    USE_CASE_ENDPOINTS.fnRequirement(projectId, functionId, requirementId)
  )
}

export async function getFlowScope(
  projectId: string,
  useCaseId: string
): Promise<UseCaseFlowScope> {
  return apiClient.get<UseCaseFlowScope>(USE_CASE_ENDPOINTS.flowScope(projectId, useCaseId))
}

export async function getMentionOptions(
  projectId: string,
  useCaseId: string,
  params: {
    query?: string
    types?: string
    screenId?: string
    mode?: 'browse' | 'search'
    limit?: number
  } = {}
): Promise<UseCaseMentionOptionsResponse> {
  const sp = new URLSearchParams()
  if (params.query) sp.set('query', params.query)
  if (params.types) sp.set('types', params.types)
  if (params.screenId) sp.set('screenId', params.screenId)
  if (params.mode) sp.set('mode', params.mode)
  if (params.limit != null) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  return apiClient.get<UseCaseMentionOptionsResponse>(
    USE_CASE_ENDPOINTS.mentionOptions(projectId, useCaseId) + (qs ? `?${qs}` : '')
  )
}

export async function getPrimaryFunctionChangeImpact(
  projectId: string,
  useCaseId: string,
  newFunctionId: string
): Promise<PrimaryFunctionChangeImpact> {
  const sp = new URLSearchParams({ newFunctionId })
  return apiClient.get<PrimaryFunctionChangeImpact>(
    `${USE_CASE_ENDPOINTS.primaryFunctionChangeImpact(projectId, useCaseId)}?${sp}`
  )
}
