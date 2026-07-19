import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { SUPPORT_ENDPOINTS } from './endpoints'
import type { SupportCase, SupportDashboardSummary } from '../../domain/model/support'

export interface SupportComment {
  id: string
  body: string
  visibility?: string
  createdAt?: string
}

export interface SlaClock {
  id: string
  caseId?: string
  status: string
  dueAt?: string | null
  breached?: boolean
}

export async function getSupportDashboard(
  workspaceId: string
): Promise<SupportDashboardSummary> {
  return apiClient.get(SUPPORT_ENDPOINTS.dashboard(workspaceId))
}

export async function listSupportCases(
  workspaceId: string
): Promise<{ items: SupportCase[] }> {
  const res = await apiClient.get<ListPayload<SupportCase>>(SUPPORT_ENDPOINTS.cases(workspaceId))
  return normalizeItemList(res)
}

export async function getSupportCase(
  workspaceId: string,
  caseId: string
): Promise<SupportCase> {
  return apiClient.get(SUPPORT_ENDPOINTS.case(workspaceId, caseId))
}

export async function triageSupportCase(
  workspaceId: string,
  caseId: string,
  body?: { ownerUserId?: string; slaPolicyId?: string }
): Promise<SupportCase> {
  return apiClient.post(SUPPORT_ENDPOINTS.triage(workspaceId, caseId), body ?? {})
}

export async function resolveSupportCase(
  workspaceId: string,
  caseId: string
): Promise<SupportCase> {
  return apiClient.post(SUPPORT_ENDPOINTS.resolve(workspaceId, caseId), {})
}

export async function closeSupportCase(
  workspaceId: string,
  caseId: string
): Promise<SupportCase> {
  return apiClient.post(SUPPORT_ENDPOINTS.close(workspaceId, caseId), {})
}

export async function listCaseComments(
  workspaceId: string,
  caseId: string
): Promise<{ items: SupportComment[] }> {
  const res = await apiClient.get<ListPayload<SupportComment>>(SUPPORT_ENDPOINTS.comments(workspaceId, caseId))
  return normalizeItemList(res)
}

export async function addCaseComment(
  workspaceId: string,
  caseId: string,
  body: string,
  visibility = 'INTERNAL'
): Promise<SupportComment> {
  return apiClient.post(SUPPORT_ENDPOINTS.comments(workspaceId, caseId), {
    body,
    visibility,
  })
}

export async function listSlaClocks(
  workspaceId: string
): Promise<{ items: SlaClock[] }> {
  const res = await apiClient.get<ListPayload<SlaClock>>(SUPPORT_ENDPOINTS.slaClocks(workspaceId))
  return normalizeItemList(res)
}

export interface SupportIncident {
  id: string
  title?: string
  status: string
  severity?: string
}

export interface SupportProblem {
  id: string
  title?: string
  status: string
}

export interface MaintenancePlan {
  id: string
  name?: string
  status?: string
}

export async function listIncidents(
  workspaceId: string
): Promise<{ items: SupportIncident[] }> {
  const res = await apiClient.get<ListPayload<SupportIncident>>(SUPPORT_ENDPOINTS.incidents(workspaceId))
  return normalizeItemList(res)
}

export async function acknowledgeIncident(
  workspaceId: string,
  incidentId: string
): Promise<SupportIncident> {
  return apiClient.post(SUPPORT_ENDPOINTS.acknowledgeIncident(workspaceId, incidentId), {})
}

export async function resolveIncident(
  workspaceId: string,
  incidentId: string
): Promise<SupportIncident> {
  return apiClient.post(SUPPORT_ENDPOINTS.resolveIncident(workspaceId, incidentId), {})
}

export async function closeIncident(
  workspaceId: string,
  incidentId: string
): Promise<SupportIncident> {
  return apiClient.post(SUPPORT_ENDPOINTS.closeIncident(workspaceId, incidentId), {})
}

export async function listProblems(
  workspaceId: string
): Promise<{ items: SupportProblem[] }> {
  const res = await apiClient.get<ListPayload<SupportProblem>>(SUPPORT_ENDPOINTS.problems(workspaceId))
  return normalizeItemList(res)
}

export async function resolveProblem(
  workspaceId: string,
  problemId: string
): Promise<SupportProblem> {
  return apiClient.post(SUPPORT_ENDPOINTS.resolveProblem(workspaceId, problemId), {})
}

export async function closeProblem(
  workspaceId: string,
  problemId: string
): Promise<SupportProblem> {
  return apiClient.post(SUPPORT_ENDPOINTS.closeProblem(workspaceId, problemId), {})
}

export async function listMaintenancePlans(
  workspaceId: string
): Promise<{ items: MaintenancePlan[] }> {
  const res = await apiClient.get<ListPayload<MaintenancePlan>>(SUPPORT_ENDPOINTS.maintenancePlans(workspaceId))
  return normalizeItemList(res)
}

export async function listMaintenanceWindows(
  workspaceId: string
): Promise<{ items: MaintenancePlan[] }> {
  const res = await apiClient.get<ListPayload<MaintenancePlan>>(SUPPORT_ENDPOINTS.maintenanceWindows(workspaceId))
  return normalizeItemList(res)
}

export async function listMaintenanceActivities(
  workspaceId: string
): Promise<{ items: MaintenancePlan[] }> {
  const res = await apiClient.get<ListPayload<MaintenancePlan>>(SUPPORT_ENDPOINTS.maintenanceActivities(workspaceId))
  return normalizeItemList(res)
}

export interface SlaPolicy {
  id: string
  policyCode: string
  name: string
  firstResponseMinutes?: number
  resolveMinutes?: number
}

export interface SupportQueue {
  id: string
  name: string
  status?: string
}

export interface SupportRequestType {
  id: string
  code?: string
  name: string
  status?: string
}

export async function listSlaPolicies(
  workspaceId: string
): Promise<{ items: SlaPolicy[] }> {
  const res = await apiClient.get<ListPayload<SlaPolicy>>(SUPPORT_ENDPOINTS.slaPolicies(workspaceId))
  return normalizeItemList(res)
}

export async function createSlaPolicy(
  workspaceId: string,
  body: {
    policyCode: string
    name: string
    firstResponseMinutes?: number
    resolveMinutes?: number
  }
): Promise<SlaPolicy> {
  return apiClient.post(SUPPORT_ENDPOINTS.slaPolicies(workspaceId), body)
}

export async function listSupportQueues(
  workspaceId: string
): Promise<{ items: SupportQueue[] }> {
  const res = await apiClient.get<ListPayload<SupportQueue>>(SUPPORT_ENDPOINTS.queues(workspaceId))
  return normalizeItemList(res)
}

export async function listRequestTypes(
  workspaceId: string
): Promise<{ items: SupportRequestType[] }> {
  const res = await apiClient.get<ListPayload<SupportRequestType>>(SUPPORT_ENDPOINTS.requestTypes(workspaceId))
  return normalizeItemList(res)
}

export interface EscalationRule {
  id: string
  name: string
  status?: string
  enabled?: boolean
}

export interface WarrantyCoverage {
  id: string
  name?: string
  status: string
  expiresAt?: string | null
}

export interface HandoverPackage {
  id: string
  name?: string
  status: string
}

export async function listEscalationRules(
  workspaceId: string
): Promise<{ items: EscalationRule[] }> {
  const res = await apiClient.get<ListPayload<EscalationRule>>(SUPPORT_ENDPOINTS.escalationRules(workspaceId))
  return normalizeItemList(res)
}

export async function enableEscalationRule(
  workspaceId: string,
  ruleId: string
): Promise<EscalationRule> {
  return apiClient.post(SUPPORT_ENDPOINTS.enableEscalationRule(workspaceId, ruleId), {})
}

export async function disableEscalationRule(
  workspaceId: string,
  ruleId: string
): Promise<EscalationRule> {
  return apiClient.post(SUPPORT_ENDPOINTS.disableEscalationRule(workspaceId, ruleId), {})
}

export async function listWarranties(
  workspaceId: string
): Promise<{ items: WarrantyCoverage[] }> {
  const res = await apiClient.get<ListPayload<WarrantyCoverage>>(SUPPORT_ENDPOINTS.warranties(workspaceId))
  return normalizeItemList(res)
}

export async function expireWarranty(
  workspaceId: string,
  warrantyId: string
): Promise<WarrantyCoverage> {
  return apiClient.post(SUPPORT_ENDPOINTS.expireWarranty(workspaceId, warrantyId), {})
}

export async function listHandoverPackages(
  workspaceId: string
): Promise<{ items: HandoverPackage[] }> {
  const res = await apiClient.get<ListPayload<HandoverPackage>>(SUPPORT_ENDPOINTS.handoverPackages(workspaceId))
  return normalizeItemList(res)
}

export async function finalizeHandoverPackage(
  workspaceId: string,
  packageId: string
): Promise<HandoverPackage> {
  return apiClient.post(SUPPORT_ENDPOINTS.finalizeHandover(workspaceId, packageId), {})
}

export interface ServiceProfile {
  id: string
  name: string
  status?: string
}

export interface CostInput {
  id: string
  name?: string
  status: string
  amount?: number
}

export async function listServiceProfiles(
  workspaceId: string
): Promise<{ items: ServiceProfile[] }> {
  const res = await apiClient.get<ListPayload<ServiceProfile>>(SUPPORT_ENDPOINTS.serviceProfiles(workspaceId))
  return normalizeItemList(res)
}

export async function listCostInputs(
  workspaceId: string
): Promise<{ items: CostInput[] }> {
  const res = await apiClient.get<ListPayload<CostInput>>(SUPPORT_ENDPOINTS.costInputs(workspaceId))
  return normalizeItemList(res)
}

export async function approveCostInput(
  workspaceId: string,
  inputId: string
): Promise<CostInput> {
  return apiClient.post(SUPPORT_ENDPOINTS.approveCostInput(workspaceId, inputId), {})
}

export async function listEfforts(
  workspaceId: string
): Promise<{ items: Array<{ id: string; effortHours?: number; status?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; effortHours?: number; status?: string }>>(SUPPORT_ENDPOINTS.efforts(workspaceId))
  return normalizeItemList(res)
}

export async function listKnowledgeLinks(
  workspaceId: string
): Promise<{ items: Array<{ id: string; label?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; label?: string }>>(SUPPORT_ENDPOINTS.knowledgeLinks(workspaceId))
  return normalizeItemList(res)
}

export async function listWorkLinks(
  workspaceId: string
): Promise<{ items: Array<{ id: string; label?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; label?: string }>>(SUPPORT_ENDPOINTS.workLinks(workspaceId))
  return normalizeItemList(res)
}

export async function listMetricSnapshots(
  workspaceId: string
): Promise<{ items: Array<{ id: string; metricCode?: string; value?: number }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; metricCode?: string; value?: number }>>(SUPPORT_ENDPOINTS.metricSnapshots(workspaceId))
  return normalizeItemList(res)
}
