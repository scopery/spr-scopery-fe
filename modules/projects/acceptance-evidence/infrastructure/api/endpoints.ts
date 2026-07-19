import { apiPath } from '@/shared/lib/api-paths'

export const EVIDENCE_ENDPOINTS = {
  listCreate: (projectId: string, deliverableId: string) =>
    apiPath(`/projects/${projectId}/deliverables/${deliverableId}/evidence`),
  get: (projectId: string, evidenceId: string) =>
    apiPath(`/projects/${projectId}/evidence/${evidenceId}`),
} as const
