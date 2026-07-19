import { apiPath } from '@/shared/lib/api-paths'

export const INTEGRATION_ENDPOINTS = {
  dashboard: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/dashboard`),
  connections: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/connections`),
  connection: (workspaceId: string, connectionId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/connections/${connectionId}`),
  enableConnection: (workspaceId: string, connectionId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/connections/${connectionId}/enable`),
  disableConnection: (workspaceId: string, connectionId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/connections/${connectionId}/disable`),
  archiveConnection: (workspaceId: string, connectionId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/connections/${connectionId}/archive`),
  healthCheck: (workspaceId: string, connectionId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/integrations/connections/${connectionId}/health-check`),
  healthChecks: (workspaceId: string, connectionId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/integrations/connections/${connectionId}/health-checks`),
  testConnection: (workspaceId: string, connectionId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/integrations/connections/${connectionId}/test-connection`),
  syncPull: (workspaceId: string, connectionId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/connections/${connectionId}/sync-pull`),
  credentialReferences: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/credential-references`),
  rotateCredential: (workspaceId: string, credentialId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/integrations/credential-references/${credentialId}/rotate`),
  revokeCredential: (workspaceId: string, credentialId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/integrations/credential-references/${credentialId}/revoke`),
  imports: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/imports`),
  exports: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/exports`),
  sync: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/sync`),
  conflicts: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/conflicts`),
  webhooks: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/integrations/webhooks`),
} as const
