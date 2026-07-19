import { apiPath } from '@/shared/lib/api-paths'

export const ORGANIZATION_ENDPOINTS = {
  get: (organizationId: string) => apiPath(`/organizations/${organizationId}`),
} as const
