import { apiPath } from '@/shared/lib/api-paths'

export const RAID_ACTION_ENDPOINTS = {
  list: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/actions`),
  create: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/actions`),
  get: (projectId: string, raidActionId: string) =>
    apiPath(`/projects/${projectId}/raid-actions/${raidActionId}`),
  update: (projectId: string, raidActionId: string) =>
    apiPath(`/projects/${projectId}/raid-actions/${raidActionId}`),
  complete: (projectId: string, raidActionId: string) =>
    apiPath(`/projects/${projectId}/raid-actions/${raidActionId}/complete`),
  cancel: (projectId: string, raidActionId: string) =>
    apiPath(`/projects/${projectId}/raid-actions/${raidActionId}/cancel`),
  createLinkedTask: (projectId: string, raidActionId: string) =>
    apiPath(`/projects/${projectId}/raid-actions/${raidActionId}/create-linked-task`),
} as const
