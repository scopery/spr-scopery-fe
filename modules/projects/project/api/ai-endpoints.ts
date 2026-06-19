import { v2 } from '@/shared/lib/api-paths'

export const AI_ENDPOINTS = {
  improve: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/improve`),
  improveCommit: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/improve/commit`),
  questionsGenerate: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/questions/generate`),
  questionsCommit: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/questions/commit`),
  intakesUploadUrl: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/intakes/upload-url`),
  intakes: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/intakes`),
  impactAnalysis: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/impact-analysis`),
  impactAnalysisCommit: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/impact-analysis/commit`),
  claritySummary: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/clarity/summary`),
  clarityAssessOne: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/clarity/assess-one`),
} as const
