import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { INTEGRATION_ENDPOINTS } from './endpoints'
import type { ImportJob, IntegrationConnection } from '../../domain/model/integration'

export async function listConnections(
  workspaceId: string
): Promise<{ items: IntegrationConnection[] }> {
  const res = await apiClient.get<ListPayload<IntegrationConnection>>(INTEGRATION_ENDPOINTS.connections(workspaceId))
  return normalizeItemList(res)
}

export async function enableConnection(
  workspaceId: string,
  connectionId: string
): Promise<IntegrationConnection> {
  return apiClient.post(INTEGRATION_ENDPOINTS.enableConnection(workspaceId, connectionId), {})
}

export async function disableConnection(
  workspaceId: string,
  connectionId: string
): Promise<IntegrationConnection> {
  return apiClient.post(INTEGRATION_ENDPOINTS.disableConnection(workspaceId, connectionId), {})
}

export async function archiveConnection(
  workspaceId: string,
  connectionId: string
): Promise<void> {
  await apiClient.patch(
    INTEGRATION_ENDPOINTS.archiveConnection(workspaceId, connectionId),
    {},
    { parseJson: false }
  )
}

export async function runHealthCheck(
  workspaceId: string,
  connectionId: string
): Promise<{ status: string }> {
  return apiClient.post(INTEGRATION_ENDPOINTS.healthCheck(workspaceId, connectionId), {})
}

export async function testConnection(
  workspaceId: string,
  connectionId: string
): Promise<{ status: string }> {
  return apiClient.post(INTEGRATION_ENDPOINTS.testConnection(workspaceId, connectionId), {})
}

export async function syncPull(
  workspaceId: string,
  connectionId: string
): Promise<{ status: string }> {
  return apiClient.post(INTEGRATION_ENDPOINTS.syncPull(workspaceId, connectionId), {})
}

export interface CredentialReference {
  id: string
  name?: string
  status?: string
}

export async function listCredentialReferences(
  workspaceId: string
): Promise<{ items: CredentialReference[] }> {
  const res = await apiClient.get<ListPayload<CredentialReference>>(INTEGRATION_ENDPOINTS.credentialReferences(workspaceId))
  return normalizeItemList(res)
}

export async function rotateCredential(
  workspaceId: string,
  credentialId: string
): Promise<CredentialReference> {
  return apiClient.post(INTEGRATION_ENDPOINTS.rotateCredential(workspaceId, credentialId), {})
}

export async function revokeCredential(
  workspaceId: string,
  credentialId: string
): Promise<void> {
  await apiClient.post(
    INTEGRATION_ENDPOINTS.revokeCredential(workspaceId, credentialId),
    {},
    { parseJson: false }
  )
}

export async function listImportJobs(
  workspaceId: string
): Promise<{ items: ImportJob[] }> {
  const res = await apiClient.get<ListPayload<ImportJob>>(INTEGRATION_ENDPOINTS.imports(workspaceId))
  return normalizeItemList(res)
}

export async function getIntegrationDashboard(workspaceId: string) {
  return apiClient.get(INTEGRATION_ENDPOINTS.dashboard(workspaceId))
}
