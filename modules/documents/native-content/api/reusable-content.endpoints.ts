import { apiPath } from '@/shared/lib/api-paths'

/** Wave 4.1 — synced blocks (§6). */
export const SYNCED_BLOCK_ENDPOINTS = {
  list: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/synced-blocks`),
  get: (workspaceId: string, syncedBlockId: string) =>
    apiPath(`/workspaces/${workspaceId}/synced-blocks/${syncedBlockId}`),
  create: (workspaceId: string, projectId: string) =>
    apiPath(`/workspaces/${workspaceId}/synced-blocks?projectId=${encodeURIComponent(projectId)}`),
  update: (workspaceId: string, syncedBlockId: string) =>
    apiPath(`/workspaces/${workspaceId}/synced-blocks/${syncedBlockId}`),
  archive: (workspaceId: string, syncedBlockId: string) =>
    apiPath(`/workspaces/${workspaceId}/synced-blocks/${syncedBlockId}/archive`),
} as const

/**
 * Wave 4.1 — native template versions (§7).
 * BE has application actions but DocumentTemplateController does not expose these yet.
 * Keep paths aligned to WAVE4_1_API_CONTRACT; gate UI with FEATURES.wave41NativeTemplates.
 */
export const NATIVE_TEMPLATE_ENDPOINTS = {
  publishNativeVersion: (workspaceId: string, templateId: string) =>
    apiPath(`/workspaces/${workspaceId}/document-templates/${templateId}/native-versions`),
  instantiate: (workspaceId: string, templateId: string, versionId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/document-templates/${templateId}/native-versions/${versionId}/instantiate`
    ),
} as const
