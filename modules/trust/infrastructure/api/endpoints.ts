import { apiPath } from '@/shared/lib/api-paths'

export const TRUST_ENDPOINTS = {
  dashboard: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/dashboard`),
  privacyRequests: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/privacy-requests`),
  retention: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/retention-policies`),
  legalHolds: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/legal-holds`),
  anonymizationPlans: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/anonymization-plans`),
  anonymizationDryRun: (workspaceId: string, planId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/anonymization-plans/${planId}/dry-run`),
  anonymizationExecute: (workspaceId: string, planId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/anonymization-plans/${planId}/execute`),
  retentionPolicies: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/retention-policies`),
  retentionDryRun: (workspaceId: string, policyId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/retention-policies/${policyId}/dry-run`),
  accessReviews: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/access-review-campaigns`),
  accessReview: (workspaceId: string, campaignId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/access-review-campaigns/${campaignId}`),
  startAccessReview: (workspaceId: string, campaignId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/access-review-campaigns/${campaignId}/start`),
  completeAccessReview: (workspaceId: string, campaignId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/trust/access-review-campaigns/${campaignId}/complete`),
  cancelAccessReview: (workspaceId: string, campaignId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/access-review-campaigns/${campaignId}/cancel`),
  findings: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/permission-review-findings`),
  resolveFinding: (workspaceId: string, findingId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/permission-review-findings/${findingId}/resolve`),
  dismissFinding: (workspaceId: string, findingId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/permission-review-findings/${findingId}/dismiss`),
  evidence: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/evidence-records`),
  finalizeEvidence: (workspaceId: string, evidenceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/evidence-records/${evidenceId}/finalize`),
  classificationPolicy: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/classification-policy`),
  sensitiveObjects: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/sensitive-objects`),
  sensitiveFields: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/sensitive-fields`),
  sensitiveAccessLogs: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/sensitive-access-logs`),
  consentRecords: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/consent-records`),
  withdrawConsent: (workspaceId: string, consentId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/consent-records/${consentId}/withdraw`),
  contactSuppressions: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/contact-suppressions`),
  releaseSuppression: (workspaceId: string, suppressionId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/contact-suppressions/${suppressionId}/release`),
  dataSubjects: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/data-subjects`),
  exportAuditLogs: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/export-audit-logs`),
  privacyExportPackages: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/privacy-export-packages`),
  retentionJobs: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/trust/retention-jobs`),
} as const
