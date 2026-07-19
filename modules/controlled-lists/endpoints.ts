import { apiPath } from '@/shared/lib/api-paths'

/**
 * Controlled Lists
 * Description: Manage org-defined controlled lists scoped to a project:
 *              list, create, update, and remove lists within a project context.
 */
export const CONTROLLED_LIST_ENDPOINTS = {
  listInProject: (projectId: string) => apiPath(`/projects/${projectId}/controlled-lists`),
  createInProject: (projectId: string) => apiPath(`/projects/${projectId}/controlled-lists`),
  get: (listId: string) => apiPath(`/controlled-lists/${listId}`),
  updateInProject: (projectId: string, listId: string) =>
    apiPath(`/projects/${projectId}/controlled-lists/${listId}`),
  removeInProject: (projectId: string, listId: string) =>
    apiPath(`/projects/${projectId}/controlled-lists/${listId}`),
} as const

/**
 * Controlled Values
 * Description: Manage individual values within a controlled list: create, update, and remove.
 */
export const CONTROLLED_VALUE_ENDPOINTS = {
  createInList: (listId: string) => apiPath(`/controlled-lists/${listId}/values`),
  update: (valueId: string) => apiPath(`/controlled-values/${valueId}`),
  remove: (valueId: string) => apiPath(`/controlled-values/${valueId}`),
} as const
