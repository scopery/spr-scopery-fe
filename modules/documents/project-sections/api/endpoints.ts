import { v2 } from '@/shared/lib/api-paths'

export const PROJECT_SECTION_ENDPOINTS = {
  list: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}/sections`),
  create: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}/sections`),
  update: (orgId: string, projectId: string, sectionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections/${sectionId}`),
  archive: (orgId: string, projectId: string, sectionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections/${sectionId}/archive`),
  reorder: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections/reorder`),
  createDefaults: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections/create-defaults`),
} as const
