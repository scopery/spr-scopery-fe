import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { TRUST_ENDPOINTS } from './endpoints'
import type { PrivacyRequest, TrustDashboardSummary } from '../../domain/model/trust'

export interface LegalHold {
  id: string
  name?: string
  status: string
  reason?: string | null
}

export interface AnonymizationPlan {
  id: string
  name?: string
  status: string
}

export async function getTrustDashboard(
  workspaceId: string
): Promise<TrustDashboardSummary> {
  return apiClient.get(TRUST_ENDPOINTS.dashboard(workspaceId))
}

export async function listPrivacyRequests(
  workspaceId: string
): Promise<{ items: PrivacyRequest[] }> {
  const res = await apiClient.get<ListPayload<PrivacyRequest>>(TRUST_ENDPOINTS.privacyRequests(workspaceId))
  return normalizeItemList(res)
}

export async function listLegalHolds(
  workspaceId: string
): Promise<{ items: LegalHold[] }> {
  const res = await apiClient.get<ListPayload<LegalHold>>(TRUST_ENDPOINTS.legalHolds(workspaceId))
  return normalizeItemList(res)
}

export async function listAnonymizationPlans(
  workspaceId: string
): Promise<{ items: AnonymizationPlan[] }> {
  const res = await apiClient.get<ListPayload<AnonymizationPlan>>(TRUST_ENDPOINTS.anonymizationPlans(workspaceId))
  return normalizeItemList(res)
}

export async function dryRunAnonymization(
  workspaceId: string,
  planId: string
): Promise<{ planId: string; status: string; blockedByLegalHold?: boolean }> {
  return apiClient.post(TRUST_ENDPOINTS.anonymizationDryRun(workspaceId, planId), {})
}

export async function executeAnonymization(
  workspaceId: string,
  planId: string
): Promise<{ planId: string; status: string }> {
  return apiClient.post(TRUST_ENDPOINTS.anonymizationExecute(workspaceId, planId), {})
}

export interface RetentionPolicy {
  id: string
  policyCode: string
  name: string
  objectTypeCode?: string
  retentionPeriodDays?: number
  retentionAction?: string
  status?: string
}

export async function listRetentionPolicies(
  workspaceId: string
): Promise<{ items: RetentionPolicy[] }> {
  const res = await apiClient.get<ListPayload<RetentionPolicy>>(TRUST_ENDPOINTS.retentionPolicies(workspaceId))
  return normalizeItemList(res)
}

export async function dryRunRetentionPolicy(
  workspaceId: string,
  policyId: string
): Promise<{ policyId: string; status: string; blockedByLegalHold?: boolean }> {
  return apiClient.post(TRUST_ENDPOINTS.retentionDryRun(workspaceId, policyId), {})
}

export interface AccessReviewCampaign {
  id: string
  name?: string
  status: string
  startedAt?: string | null
  completedAt?: string | null
}

export interface PermissionReviewFinding {
  id: string
  campaignId?: string
  status: string
  summary?: string
}

export interface EvidenceRecord {
  id: string
  title?: string
  status: string
  evidenceType?: string
}

export async function listAccessReviewCampaigns(
  workspaceId: string
): Promise<{ items: AccessReviewCampaign[] }> {
  const res = await apiClient.get<ListPayload<AccessReviewCampaign>>(TRUST_ENDPOINTS.accessReviews(workspaceId))
  return normalizeItemList(res)
}

export async function startAccessReview(
  workspaceId: string,
  campaignId: string
): Promise<AccessReviewCampaign> {
  return apiClient.post(TRUST_ENDPOINTS.startAccessReview(workspaceId, campaignId), {})
}

export async function completeAccessReview(
  workspaceId: string,
  campaignId: string
): Promise<AccessReviewCampaign> {
  return apiClient.post(TRUST_ENDPOINTS.completeAccessReview(workspaceId, campaignId), {})
}

export async function cancelAccessReview(
  workspaceId: string,
  campaignId: string
): Promise<AccessReviewCampaign> {
  return apiClient.post(TRUST_ENDPOINTS.cancelAccessReview(workspaceId, campaignId), {})
}

export async function listPermissionFindings(
  workspaceId: string
): Promise<{ items: PermissionReviewFinding[] }> {
  const res = await apiClient.get<ListPayload<PermissionReviewFinding>>(TRUST_ENDPOINTS.findings(workspaceId))
  return normalizeItemList(res)
}

export async function resolveFinding(
  workspaceId: string,
  findingId: string
): Promise<PermissionReviewFinding> {
  return apiClient.post(TRUST_ENDPOINTS.resolveFinding(workspaceId, findingId), {})
}

export async function dismissFinding(
  workspaceId: string,
  findingId: string
): Promise<PermissionReviewFinding> {
  return apiClient.post(TRUST_ENDPOINTS.dismissFinding(workspaceId, findingId), {})
}

export async function listEvidenceRecords(
  workspaceId: string
): Promise<{ items: EvidenceRecord[] }> {
  const res = await apiClient.get<ListPayload<EvidenceRecord>>(TRUST_ENDPOINTS.evidence(workspaceId))
  return normalizeItemList(res)
}

export async function finalizeEvidence(
  workspaceId: string,
  evidenceId: string
): Promise<EvidenceRecord> {
  return apiClient.post(TRUST_ENDPOINTS.finalizeEvidence(workspaceId, evidenceId), {})
}

export interface ClassificationPolicy {
  defaultLevel?: string
  updatedAt?: string
}

export interface SensitiveObject {
  id: string
  objectType?: string
  classification?: string
  status?: string
}

export interface ConsentRecord {
  id: string
  subjectLabel?: string
  status: string
}

export interface ContactSuppression {
  id: string
  channel?: string
  status: string
}

export async function getClassificationPolicy(
  workspaceId: string
): Promise<ClassificationPolicy> {
  return apiClient.get(TRUST_ENDPOINTS.classificationPolicy(workspaceId))
}

export async function listSensitiveObjects(
  workspaceId: string
): Promise<{ items: SensitiveObject[] }> {
  const res = await apiClient.get<ListPayload<SensitiveObject>>(TRUST_ENDPOINTS.sensitiveObjects(workspaceId))
  return normalizeItemList(res)
}

export async function listConsentRecords(
  workspaceId: string
): Promise<{ items: ConsentRecord[] }> {
  const res = await apiClient.get<ListPayload<ConsentRecord>>(TRUST_ENDPOINTS.consentRecords(workspaceId))
  return normalizeItemList(res)
}

export async function withdrawConsent(
  workspaceId: string,
  consentId: string
): Promise<ConsentRecord> {
  return apiClient.post(TRUST_ENDPOINTS.withdrawConsent(workspaceId, consentId), {})
}

export async function listContactSuppressions(
  workspaceId: string
): Promise<{ items: ContactSuppression[] }> {
  const res = await apiClient.get<ListPayload<ContactSuppression>>(TRUST_ENDPOINTS.contactSuppressions(workspaceId))
  return normalizeItemList(res)
}

export async function releaseSuppression(
  workspaceId: string,
  suppressionId: string
): Promise<ContactSuppression> {
  return apiClient.post(TRUST_ENDPOINTS.releaseSuppression(workspaceId, suppressionId), {})
}

export async function listDataSubjects(
  workspaceId: string
): Promise<{ items: Array<{ id: string; label?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; label?: string }>>(TRUST_ENDPOINTS.dataSubjects(workspaceId))
  return normalizeItemList(res)
}

export async function listExportAuditLogs(
  workspaceId: string
): Promise<{ items: Array<{ id: string; status?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; status?: string }>>(TRUST_ENDPOINTS.exportAuditLogs(workspaceId))
  return normalizeItemList(res)
}

export async function listPrivacyExportPackages(
  workspaceId: string
): Promise<{ items: Array<{ id: string; status?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; status?: string }>>(TRUST_ENDPOINTS.privacyExportPackages(workspaceId))
  return normalizeItemList(res)
}

export async function listRetentionJobs(
  workspaceId: string
): Promise<{ items: Array<{ id: string; status?: string }> }> {
  const res = await apiClient.get<ListPayload<{ id: string; status?: string }>>(TRUST_ENDPOINTS.retentionJobs(workspaceId))
  return normalizeItemList(res)
}
