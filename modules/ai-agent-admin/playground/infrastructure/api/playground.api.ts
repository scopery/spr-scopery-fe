import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import type {
  PlaygroundDirectRunPayload,
  PlaygroundOptions,
  PlaygroundOptionItem,
  PlaygroundPromptPreviewPayload,
  PlaygroundPromptPreviewResult,
  PlaygroundRunPayload,
  PlaygroundRunResult,
} from '../../domain/model/playground'

function asOptions(raw: unknown): PlaygroundOptionItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const o = item as Record<string, unknown>
    return {
      id: String(o.id ?? o.value ?? ''),
      label: String(o.label ?? o.name ?? o.code ?? o.id ?? ''),
      code: o.code != null ? String(o.code) : undefined,
      status: o.status != null ? String(o.status) : undefined,
      agentId: o.agentId != null ? String(o.agentId) : undefined,
      templateId: o.templateId != null ? String(o.templateId) : undefined,
    }
  }).filter((o) => o.id)
}

function normalizeOptions(res: unknown): PlaygroundOptions {
  if (!res || typeof res !== 'object') {
    return { eventConfigs: [], agents: [], promptVersions: [], modelDeployments: [] }
  }
  const p = res as Record<string, unknown>
  return {
    eventConfigs: asOptions(p.eventConfigs ?? p.eventConfigOptions),
    agents: asOptions(p.agents ?? p.agentOptions),
    promptVersions: asOptions(p.promptVersions ?? p.promptVersionOptions),
    modelDeployments: asOptions(p.modelDeployments ?? p.modelDeploymentOptions),
  }
}

export async function getPlaygroundOptions(params?: {
  includeEventConfigs?: boolean
  includeAgents?: boolean
  includePromptVersions?: boolean
  includeModelDeployments?: boolean
}): Promise<PlaygroundOptions> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.playgroundOptions(params))
  return normalizeOptions(res)
}

export async function runPlaygroundEventConfig(
  eventConfigId: string,
  body: PlaygroundRunPayload
): Promise<PlaygroundRunResult> {
  return apiClient.post<PlaygroundRunResult>(
    AI_AGENT_ADMIN_ENDPOINTS.playgroundEventConfigRun(eventConfigId),
    body
  )
}

export async function runPlaygroundDirect(
  body: PlaygroundDirectRunPayload
): Promise<PlaygroundRunResult> {
  return apiClient.post<PlaygroundRunResult>(
    AI_AGENT_ADMIN_ENDPOINTS.playgroundDirectRun(),
    body
  )
}

export async function previewPlaygroundPrompt(
  body: PlaygroundPromptPreviewPayload
): Promise<PlaygroundPromptPreviewResult> {
  return apiClient.post<PlaygroundPromptPreviewResult>(
    AI_AGENT_ADMIN_ENDPOINTS.playgroundPromptPreview(),
    body
  )
}
