import { apiClient } from '@/shared/lib/apiClient'
import { ORGANIZATION_ENDPOINTS } from './endpoints'
import type { OrganizationDetail } from '../model'

export async function getOrganization(organizationId: string): Promise<OrganizationDetail> {
  return apiClient.get<OrganizationDetail>(ORGANIZATION_ENDPOINTS.get(organizationId))
}
