import { apiPath } from '@/shared/lib/api-paths'

export const RAID_LINK_ENDPOINTS = {
  list: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/links`),
  create: (projectId: string, raidItemId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/links`),
  delete: (projectId: string, raidItemId: string, linkId: string) =>
    apiPath(`/projects/${projectId}/raid-items/${raidItemId}/links/${linkId}`),
} as const
