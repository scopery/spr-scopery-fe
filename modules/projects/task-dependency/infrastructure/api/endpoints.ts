import { apiPath } from '@/shared/lib/api-paths'

export const TASK_DEP_ENDPOINTS = {
  list: (projectId: string, params?: { predecessorTaskId?: string; successorTaskId?: string }) => {
    const p = new URLSearchParams()
    if (params?.predecessorTaskId) p.set('predecessorTaskId', params.predecessorTaskId)
    if (params?.successorTaskId) p.set('successorTaskId', params.successorTaskId)
    const q = p.toString()
    return apiPath(`/projects/${projectId}/task-dependencies`) + (q ? `?${q}` : '')
  },
  get: (projectId: string, dependencyId: string) =>
    apiPath(`/projects/${projectId}/task-dependencies/${dependencyId}`),
  create: (projectId: string) =>
    apiPath(`/projects/${projectId}/task-dependencies`),
  delete: (projectId: string, dependencyId: string) =>
    apiPath(`/projects/${projectId}/task-dependencies/${dependencyId}`),
} as const
