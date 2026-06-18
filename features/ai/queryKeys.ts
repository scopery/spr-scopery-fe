/**
 * React Query key factory for AI and related data.
 * Use for invalidation when adopting React Query.
 */

export const aiQueryKeys = {
  session: (orgId: string, projectId: string, sessionId: string) =>
    ['session', orgId, projectId, sessionId] as const,
  sessionProgress: (orgId: string, projectId: string, sessionId: string) =>
    ['sessionProgress', orgId, projectId, sessionId] as const,
  projectQuestions: (orgId: string, projectId: string) =>
    ['projectQuestions', orgId, projectId] as const,
  sessions: (orgId: string, projectId: string) =>
    ['sessions', orgId, projectId] as const,
  project: (orgId: string, projectId: string) =>
    ['project', orgId, projectId] as const,
}
