import { v2 } from '@/shared/lib/api-paths'

export const CONTROLLED_LIST_ENDPOINTS = {
  listInProject: (projectId: string) => v2(`/projects/${projectId}/controlled-lists`),
  createInProject: (projectId: string) => v2(`/projects/${projectId}/controlled-lists`),
  get: (listId: string) => v2(`/controlled-lists/${listId}`),
  updateInProject: (projectId: string, listId: string) =>
    v2(`/projects/${projectId}/controlled-lists/${listId}`),
  removeInProject: (projectId: string, listId: string) =>
    v2(`/projects/${projectId}/controlled-lists/${listId}`),
} as const
