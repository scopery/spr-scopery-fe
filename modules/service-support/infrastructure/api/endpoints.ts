import { apiPath } from '@/shared/lib/api-paths'

export const SUPPORT_ENDPOINTS = {
  dashboard: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/dashboard`),
  cases: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/cases`),
  case: (workspaceId: string, caseId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/cases/${caseId}`),
  triage: (workspaceId: string, caseId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/cases/${caseId}/triage`),
  resolve: (workspaceId: string, caseId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/cases/${caseId}/resolve`),
  close: (workspaceId: string, caseId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/cases/${caseId}/close`),
  comments: (workspaceId: string, caseId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/cases/${caseId}/comments`),
  slaClocks: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/sla-clocks`),
  incidents: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/incidents`),
  acknowledgeIncident: (workspaceId: string, incidentId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/incidents/${incidentId}/acknowledge`),
  resolveIncident: (workspaceId: string, incidentId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/incidents/${incidentId}/resolve`),
  closeIncident: (workspaceId: string, incidentId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/incidents/${incidentId}/close`),
  problems: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/problems`),
  resolveProblem: (workspaceId: string, problemId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/problems/${problemId}/resolve`),
  closeProblem: (workspaceId: string, problemId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/problems/${problemId}/close`),
  maintenancePlans: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/maintenance-plans`),
  maintenanceWindows: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/maintenance-windows`),
  maintenanceActivities: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/maintenance-activities`),
  maintenance: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/maintenance`),
  slaPolicies: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/sla-policies`),
  slaBreaches: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/sla-breaches`),
  queues: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/queues`),
  requestTypes: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/request-types`),
  escalationRules: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/escalation-rules`),
  enableEscalationRule: (workspaceId: string, ruleId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/escalation-rules/${ruleId}/enable`),
  disableEscalationRule: (workspaceId: string, ruleId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/escalation-rules/${ruleId}/disable`),
  warranties: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/warranties`),
  expireWarranty: (workspaceId: string, warrantyId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/warranties/${warrantyId}/expire`),
  handoverPackages: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/handover-packages`),
  finalizeHandover: (workspaceId: string, packageId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/handover-packages/${packageId}/finalize`),
  serviceProfiles: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/service-profiles`),
  costInputs: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/cost-inputs`),
  approveCostInput: (workspaceId: string, inputId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/cost-inputs/${inputId}/approve`),
  efforts: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/efforts`),
  knowledgeLinks: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/knowledge-links`),
  workLinks: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/work-links`),
  metricSnapshots: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/support/metric-snapshots`),
} as const
